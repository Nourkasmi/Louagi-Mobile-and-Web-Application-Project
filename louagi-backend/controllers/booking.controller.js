// booking.controller.js (FULL UPDATED VERSION)

const { Booking, Trip, Passenger, Destination, Schedule, Driver, User, DriverQueue } = require('../models');
const { Op } = require('sequelize');
const { validateBooking, validateBookingUpdate, validateBulkBookingUpdate } = require('../middlewares/validate.middleware');
const { sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

// ✅ KEEP: reindexQueuePositions unchanged
async function reindexQueuePositions(stationId, scheduleId, destinationId, transaction) {
  if (!stationId || !scheduleId || !destinationId) {
    console.log('⚠️ Missing queue identifiers, skipping reindex');
    return;
  }
  const waitingDrivers = await DriverQueue.findAll({
    where: { stationId, scheduleId, destinationId, status: 'waiting' },
    order: [['position', 'ASC']],
    transaction
  });
  for (let i = 0; i < waitingDrivers.length; i++) {
    const newPosition = i + 1;
    if (waitingDrivers[i].position !== newPosition) {
      await waitingDrivers[i].update({ position: newPosition }, { transaction });
    }
  }
  console.log(`✅ Reindexed ${waitingDrivers.length} queue positions`);
}

const bookingController = {
  // ✅ FULLY UPDATED createBooking method (with extended window)
  createBooking: async (req, res) => {
    try {
      const { error } = validateBooking(req.body);
      if (error) return res.status(400).json({ success: false, message: error.details[0].message });

      const { tripId, seats = 1, specialRequests } = req.body;
      const userId = req.user.id;

      const passenger = await Passenger.findOne({ where: { user_id: userId } });
      if (!passenger) return res.status(404).json({ success: false, message: 'Passenger profile not found' });

      const result = await sequelize.transaction(async (t) => {
        const trip = await Trip.findByPk(tripId, { lock: true, transaction: t });
        if (!trip) throw new Error('Trip not found');

        const [route, schedule, driver, queueEntry] = await Promise.all([
          Destination.findByPk(trip.routeId, { transaction: t }),
          Schedule.findByPk(trip.scheduleId, { transaction: t }),
          Driver.findByPk(trip.driverId, { transaction: t }),
          trip.queueId ? DriverQueue.findByPk(trip.queueId, { transaction: t }) : null
        ]);

        if (trip.status !== 'scheduled') throw new Error('Trip is not available for booking');

        // ✅ Allow booking up to 1 hour after departure time
        if (trip.departureTime) {
          const now = new Date();
          const departureTime = new Date(trip.departureTime);
          const bookingCutoff = new Date(departureTime.getTime() + 60 * 60 * 1000);
          if (now > bookingCutoff) {
            throw new Error('Cannot book this trip: booking allowed only up to 1 hour after departure.');
          }
        }

        if (trip.availableSeats < seats) throw new Error(`Only ${trip.availableSeats} seats available`);

        const existingBooking = await Booking.findOne({
          where: { tripId, passengerId: passenger.id, status: { [Op.notIn]: ['cancelled'] } },
          transaction: t
        });
        if (existingBooking) throw new Error('You already have a booking for this trip');

        const pricePerSeat = parseFloat(trip.currentPrice);
        const totalAmount = pricePerSeat * seats;

        const prefix = 'LG';
        const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
        const bookingReference = `${prefix}-${randomDigits}`;

        const booking = await Booking.create({
          tripId,
          passengerId: passenger.id,
          seats,
          amount: totalAmount,
          specialRequests,
          status: 'pending',
          paymentStatus: 'pending',
          bookingReference
        }, { transaction: t });

        const newAvailableSeats = trip.availableSeats - seats;
        await trip.update({ availableSeats: newAvailableSeats }, { transaction: t });

        let wasAutoStarted = false;
        let autoConfirmedBookings = 0;

        if (newAvailableSeats === 0) {
          console.log(`🚗 Trip ${tripId} is now FULL! Auto-starting...`);
          const actualDepartureTime = new Date();
          const actualArrivalTime = new Date(actualDepartureTime.getTime() + (route.estimatedDuration * 60 * 1000));

          await trip.update({
            status: 'in_progress',
            actualDepartureTime,
            actualArrivalTime,
            notes: (trip.notes || '') + ` - Auto-started at ${actualDepartureTime.toLocaleTimeString()} (fully booked)`
          }, { transaction: t });

          if (queueEntry) {
            const { stationId, scheduleId, destinationId } = queueEntry;
            await queueEntry.destroy({ transaction: t });
            const { updateQueueTripTimes } = require('../utils/queue.utils');
            await updateQueueTripTimes(stationId, scheduleId, destinationId, t);
            console.log(`✅ Driver removed from queue, remaining positions and times updated`);
          }

          const updateResult = await Booking.update(
            { status: 'confirmed', paymentStatus: 'completed' },
            { where: { tripId, status: 'pending' }, transaction: t }
          );

          autoConfirmedBookings = updateResult[0] || 0;
          wasAutoStarted = true;
          console.log(`✅ Trip ${tripId} auto-started with full capacity, ${autoConfirmedBookings} bookings confirmed`);
        }

        return {
          booking,
          trip: { ...trip.toJSON(), route, schedule, driver, queueEntry },
          wasAutoStarted,
          autoConfirmedBookings
        };
      });

      const completeBooking = await Booking.findByPk(result.booking.id, {
        include: [
          { model: Trip, as: 'trip', include: [
            { model: Destination, as: 'route' },
            { model: Schedule, as: 'schedule' },
            { model: Driver, as: 'driver' }
          ] },
          { model: Passenger, as: 'passenger', include: [
            { model: User, as: 'user', attributes: ['username', 'email', 'phone'] }
          ] }
        ]
      });

      let timingInfo = null;
      if (completeBooking.trip.departureTime) {
        const { formatTripTime, calculateDuration } = require('../utils/time.utils');
        const departureFormatted = formatTripTime(completeBooking.trip.departureTime);
        const arrivalFormatted = formatTripTime(completeBooking.trip.estimatedArrivalTime);
        const duration = calculateDuration(
          completeBooking.trip.departureTime,
          completeBooking.trip.estimatedArrivalTime
        );

        timingInfo = {
          departureTime: completeBooking.trip.departureTime,
          estimatedArrivalTime: completeBooking.trip.estimatedArrivalTime,
          formattedDeparture: departureFormatted.full,
          formattedArrival: arrivalFormatted.full,
          duration: duration.readable,
          minutesUntilDeparture: Math.max(0, Math.round((completeBooking.trip.departureTime - new Date()) / (1000 * 60)))
        };
      }

      return res.status(201).json({
        success: true,
        booking: completeBooking,
        timing: timingInfo,
        message: result.wasAutoStarted
          ? `Booking created and trip auto-started! ${result.autoConfirmedBookings} bookings confirmed.`
          : 'Booking created successfully',
        tripAutoStarted: result.wasAutoStarted,
        autoConfirmedBookings: result.autoConfirmedBookings || 0
      });

    } catch (error) {
      console.error('Create booking error:', error);
      return res.status(400).json({ success: false, message: error.message || 'Failed to create booking' });
    }
  },
  getAllBookings: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { status, tripId, passengerId, search, sortBy, order, startDate, endDate } = req.query;

      const whereClause = {};

      if (status) whereClause.status = status;
      if (tripId) whereClause.tripId = tripId;
      if (passengerId) whereClause.passengerId = passengerId;

      // Date range filtering
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
      }

      if (search) {
        whereClause[Op.or] = [
          { bookingReference: { [Op.iLike]: `%${search}%` } },
          { specialRequests: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Booking.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Trip,
            as: 'trip',
            include: [
              { model: Destination, as: 'route' },
              { model: Schedule, as: 'schedule' },
              { model: Driver, as: 'driver' }
            ]
          },
          {
            model: Passenger,
            as: 'passenger',
            include: [{ model: User, as: 'user', attributes: ['username', 'email', 'phone'] }]
          }
        ],
        limit,
        offset,
        order: [[sortBy || 'createdAt', order === 'asc' ? 'ASC' : 'DESC']]
      });

      // Calculate summary statistics
      const summary = {
        totalBookings: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalRevenue: rows.reduce((sum, booking) => 
          ['confirmed', 'completed'].includes(booking.status) ? 
          sum + parseFloat(booking.amount) : sum, 0
        ),
        statusBreakdown: rows.reduce((acc, booking) => {
          acc[booking.status] = (acc[booking.status] || 0) + 1;
          return acc;
        }, {})
      };

      return res.status(200).json({
        success: true,
        bookings: rows,
        summary
      });

    } catch (error) {
      console.error('Get all bookings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve bookings'
      });
    }
  },
  
  /**
   * Get booking by ID
   */
  getBookingById: async (req, res) => {
    try {
      const { id } = req.params;

      const booking = await Booking.findByPk(id, {
        include: [
          {
            model: Trip,
            as: 'trip',
            include: [
              { model: Destination, as: 'route' },
              { model: Schedule, as: 'schedule' },
              { model: Driver, as: 'driver' }
            ]
          },
          {
            model: Passenger,
            as: 'passenger',
            include: [{ model: User, as: 'user', attributes: ['username', 'email', 'phone'] }]
          }
        ]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      return res.status(200).json({
        success: true,
        booking
      });

    } catch (error) {
      console.error('Get booking by ID error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking'
      });
    }
  },

  /**
   * Get booking by reference number (public access)
   */
  getBookingByReference: async (req, res) => {
    try {
      const { reference } = req.params;

      const booking = await Booking.findOne({
        where: { bookingReference: reference },
        include: [
          {
            model: Trip,
            as: 'trip',
            include: [
              { model: Destination, as: 'route' },
              { model: Schedule, as: 'schedule' }
            ]
          }
        ],
        attributes: { exclude: ['passengerId'] }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      return res.status(200).json({
        success: true,
        booking
      });

    } catch (error) {
      console.error('Get booking by reference error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking'
      });
    }
  },

  /**
   * ✅ ENHANCED: Get passenger's own bookings with better filtering
   */
  getPassengerBookings: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const passenger = await Passenger.findOne({ where: { user_id: userId } });
      if (!passenger) {
        return res.status(404).json({
          success: false,
          message: 'Passenger profile not found'
        });
      }

      const { status, startDate, endDate } = req.query;
      const whereClause = { passengerId: passenger.id };
      
      if (status) whereClause.status = status;
      
      // ✅ NEW: Date range filtering for passenger bookings
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
        if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
      }

      const { count, rows } = await Booking.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Trip,
            as: 'trip',
            include: [
              { model: Destination, as: 'route' },
              { model: Schedule, as: 'schedule' },
              { model: Driver, as: 'driver' }
            ]
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      // ✅ NEW: Passenger-specific statistics
      const summary = {
        totalBookings: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalSpent: rows.reduce((sum, booking) => 
          ['confirmed', 'completed'].includes(booking.status) ? 
          sum + parseFloat(booking.amount) : sum, 0
        ),
        upcomingTrips: rows.filter(booking => 
          booking.trip && 
          new Date(booking.trip.departureTime) > new Date() &&
          ['pending', 'confirmed'].includes(booking.status)
        ).length,
        completedTrips: rows.filter(booking => booking.status === 'completed').length
      };

      return res.status(200).json({
        success: true,
        bookings: rows,
        summary
      });

    } catch (error) {
      console.error('Get passenger bookings error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve passenger bookings'
      });
    }
  },

  /**
   * ✅ ENHANCED: Get all bookings for a specific trip with better analytics
   */
  getBookingsByTrip: async (req, res) => {
    try {
      const { tripId } = req.params;
      const userId = req.user.id;

      // Verify driver access if user is driver
      if (req.user.role === 'driver') {
        const driver = await Driver.findOne({ where: { user_id: userId } });
        
        if (!driver) {
          return res.status(404).json({
            success: false,
            message: 'Driver profile not found'
          });
        }

        const trip = await Trip.findOne({
          where: { id: tripId, driverId: driver.id }
        });

        if (!trip) {
          return res.status(403).json({
            success: false,
            message: 'You can only view bookings for your own trips'
          });
        }
      }

      const bookings = await Booking.findAll({
        where: { tripId },
        include: [
          {
            model: Passenger,
            as: 'passenger',
            include: [{ model: User, as: 'user', attributes: ['username', 'phone'] }]
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      // ✅ ENHANCED: More detailed summary
      const summary = {
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        noShowBookings: bookings.filter(b => b.status === 'no_show').length,
        totalSeats: bookings.reduce((sum, b) => sum + b.seats, 0),
        confirmedSeats: bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.seats, 0),
        totalRevenue: bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).reduce((sum, b) => sum + parseFloat(b.amount), 0),
        averageBookingValue: bookings.length > 0 ? 
          bookings.reduce((sum, b) => sum + parseFloat(b.amount), 0) / bookings.length : 0
      };

      return res.status(200).json({
        success: true,
        bookings,
        summary
      });

    } catch (error) {
      console.error('Get bookings by trip error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve trip bookings'
      });
    }
  },

  /**
   * ✅ FIXED: Update booking status with better validation (Fixed lock issue)
   */
  updateBookingStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = validateBookingUpdate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { status, cancellationReason } = req.body;

      const result = await sequelize.transaction(async (t) => {
        // ✅ FIX: Get booking without includes first, then lock
        const booking = await Booking.findByPk(id, {
          lock: true,
          transaction: t
        });

        if (!booking) {
          throw new Error('Booking not found');
        }

        // ✅ FIX: Get trip separately
        const trip = await Trip.findByPk(booking.tripId, { transaction: t });

        const validTransitions = {
          'pending': ['confirmed', 'cancelled'],
          'confirmed': ['completed', 'cancelled', 'no_show'],
          'cancelled': [],
          'completed': [],
          'no_show': []
        };

        if (!validTransitions[booking.status].includes(status)) {
          throw new Error(`Cannot change booking status from ${booking.status} to ${status}`);
        }

        // ✅ NEW: Check if trip has already departed for certain status changes
        if (['cancelled'].includes(status) && new Date(trip.departureTime) <= new Date()) {
          throw new Error('Cannot cancel booking for trip that has already departed');
        }

        // Update available seats if cancelling or marking no-show
        if ((status === 'cancelled' || status === 'no_show') && booking.status !== 'cancelled') {
          await trip.update({
            availableSeats: trip.availableSeats + booking.seats
          }, { transaction: t });
        }

        const updateData = { status };
        if ((status === 'cancelled' || status === 'no_show') && cancellationReason) {
          updateData.cancellationReason = cancellationReason;
        }

        await booking.update(updateData, { transaction: t });
        return booking;
      });

      return res.status(200).json({
        success: true,
        booking: result,
        message: `Booking ${status} successfully`
      });

    } catch (error) {
      console.error('Update booking status error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update booking status'
      });
    }
  },

  /**
   * ✅ FIXED: Cancel booking with better validation (Fixed lock issue)
   */
  cancelBooking: async (req, res) => {
    try {
      const { id } = req.params;
      const { cancellationReason } = req.body;
      const userId = req.user.id;

      const passenger = await Passenger.findOne({ where: { user_id: userId } });
      if (!passenger) {
        return res.status(404).json({
          success: false,
          message: 'Passenger profile not found'
        });
      }

      const result = await sequelize.transaction(async (t) => {
        // ✅ FIX: Get booking without includes first, then lock
        const booking = await Booking.findOne({
          where: {
            id,
            passengerId: passenger.id
          },
          lock: true,
          transaction: t
        });

        if (!booking) {
          throw new Error('Booking not found or you do not have permission to cancel it');
        }

        // ✅ FIX: Get trip separately
        const trip = await Trip.findByPk(booking.tripId, { transaction: t });

        if (booking.status === 'cancelled') {
          throw new Error('Booking is already cancelled');
        }

        if (booking.status === 'completed') {
          throw new Error('Cannot cancel completed booking');
        }

        // ✅ NEW: Check cancellation time limits
        const departureTime = new Date(trip.departureTime);
        const now = new Date();
        const hoursUntilDeparture = (departureTime - now) / (1000 * 60 * 60);

        if (departureTime <= now) {
          throw new Error('Cannot cancel booking for trip that has already departed');
        }

        if (hoursUntilDeparture < 1) {
          throw new Error('Cannot cancel booking less than 1 hour before departure');
        }

        // ✅ NEW: Check if trip is in progress
        if (trip.status === 'in_progress') {
          throw new Error('Cannot cancel booking for trip that is already in progress');
        }

        await trip.update({
          availableSeats: trip.availableSeats + booking.seats
        }, { transaction: t });

        await booking.update({
          status: 'cancelled',
          cancellationReason: cancellationReason || 'Cancelled by passenger'
        }, { transaction: t });

        return booking;
      });

      return res.status(200).json({
        success: true,
        booking: result,
        message: 'Booking cancelled successfully'
      });

    } catch (error) {
      console.error('Cancel booking error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel booking'
      });
    }
  },

  // ... rest of the methods remain the same ...
  checkInPassenger: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const booking = await Booking.findByPk(id, {
        include: [
          {
            model: Trip,
            as: 'trip',
            include: [{ model: Driver, as: 'driver' }]
          }
        ]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (req.user.role === 'driver') {
        const driver = await Driver.findOne({ where: { user_id: userId } });
        
        if (!driver || booking.trip.driverId !== driver.id) {
          return res.status(403).json({
            success: false,
            message: 'You can only check in passengers for your own trips'
          });
        }
      }

      if (booking.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot check in booking with status: ${booking.status}`
        });
      }

      await booking.update({
        status: 'confirmed',
        paymentStatus: 'completed'
      });

      return res.status(200).json({
        success: true,
        booking,
        message: 'Passenger checked in successfully'
      });

    } catch (error) {
      console.error('Check in passenger error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check in passenger'
      });
    }
  },

  markNoShow: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const booking = await Booking.findByPk(id, {
        include: [
          {
            model: Trip,
            as: 'trip',
            include: [{ model: Driver, as: 'driver' }]
          }
        ]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (req.user.role === 'driver') {
        const driver = await Driver.findOne({ where: { user_id: userId } });
        
        if (!driver || booking.trip.driverId !== driver.id) {
          return res.status(403).json({
            success: false,
            message: 'You can only mark no-show for your own trips'
          });
        }
      }

      if (!['pending', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot mark no-show for booking with status: ${booking.status}`
        });
      }

      const result = await sequelize.transaction(async (t) => {
        await booking.trip.update({
          availableSeats: booking.trip.availableSeats + booking.seats
        }, { transaction: t });

        await booking.update({
          status: 'no_show',
          cancellationReason: 'Passenger did not show up'
        }, { transaction: t });

        return booking;
      });

      return res.status(200).json({
        success: true,
        booking: result,
        message: 'Passenger marked as no-show'
      });

    } catch (error) {
      console.error('Mark no-show error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark passenger as no-show'
      });
    }
  },

  bulkUpdateBookingStatus: async (req, res) => {
    try {
      const { tripId } = req.params;
      const { error } = validateBulkBookingUpdate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { bookingIds, status, reason } = req.body;

      const result = await sequelize.transaction(async (t) => {
        const bookings = await Booking.findAll({
          where: {
            id: { [Op.in]: bookingIds },
            tripId
          },
          include: [{ model: Trip, as: 'trip' }],
          transaction: t
        });

        if (bookings.length !== bookingIds.length) {
          throw new Error('Some bookings not found or do not belong to this trip');
        }

        const updatedBookings = [];
        
        for (const booking of bookings) {
          const validTransitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['completed', 'cancelled', 'no_show'],
            'cancelled': [],
            'completed': [],
            'no_show': []
          };

          if (!validTransitions[booking.status].includes(status)) {
            throw new Error(`Cannot change booking ${booking.id} from ${booking.status} to ${status}`);
          }

          if ((status === 'cancelled' || status === 'no_show') && 
              !['cancelled', 'no_show'].includes(booking.status)) {
            await booking.trip.update({
              availableSeats: booking.trip.availableSeats + booking.seats
            }, { transaction: t });
          }

          const updateData = { status };
          if ((status === 'cancelled' || status === 'no_show') && reason) {
            updateData.cancellationReason = reason;
          }

          await booking.update(updateData, { transaction: t });
          updatedBookings.push(booking);
        }

        return updatedBookings;
      });

      return res.status(200).json({
        success: true,
        updatedCount: result.length,
        bookings: result,
        message: `Successfully updated ${result.length} bookings to ${status}`
      });

    } catch (error) {
      console.error('Bulk update booking status error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update booking statuses'
      });
    }
  },

  getBookingConflicts: async (req, res) => {
    try {
      const { tripId } = req.params;

      const trip = await Trip.findByPk(tripId, {
        include: [{ model: Destination, as: 'route' }]
      });

      if (!trip) {
        return res.status(404).json({
          success: false,
          message: 'Trip not found'
        });
      }

      const bookings = await Booking.findAll({
        where: {
          tripId,
          status: { [Op.notIn]: ['cancelled', 'no_show'] }
        }
      });

      const totalBookedSeats = bookings.reduce((sum, booking) => sum + booking.seats, 0);
      const conflicts = [];

      if (totalBookedSeats > trip.capacity) {
        conflicts.push({
          type: 'overbooking',
          message: `Trip is overbooked: ${totalBookedSeats} seats booked, ${trip.capacity} available`,
          severity: 'critical',
          data: {
            bookedSeats: totalBookedSeats,
            capacity: trip.capacity,
            excess: totalBookedSeats - trip.capacity
          }
        });
      }

      const passengerCounts = {};
      bookings.forEach(booking => {
        passengerCounts[booking.passengerId] = (passengerCounts[booking.passengerId] || 0) + 1;
      });

      Object.entries(passengerCounts).forEach(([passengerId, count]) => {
        if (count > 1) {
          conflicts.push({
            type: 'duplicate_passenger',
            message: `Passenger has ${count} bookings for the same trip`,
            severity: 'warning',
            data: { passengerId, bookingCount: count }
          });
        }
      });

      const now = new Date();
      const departureTime = new Date(trip.departureTime);
      
      if (departureTime <= now) {
        const lateBookings = bookings.filter(booking => 
          new Date(booking.createdAt) > departureTime
        );

        if (lateBookings.length > 0) {
          conflicts.push({
            type: 'late_bookings',
            message: `${lateBookings.length} bookings made after departure time`,
            severity: 'warning',
            data: { lateBookings: lateBookings.map(b => b.id) }
          });
        }
      }

      return res.status(200).json({
        success: true,
        conflicts,
        summary: {
          totalConflicts: conflicts.length,
          criticalIssues: conflicts.filter(c => c.severity === 'critical').length,
          warnings: conflicts.filter(c => c.severity === 'warning').length
        }
      });

    } catch (error) {
      console.error('Get booking conflicts error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check booking conflicts'
      });
    }
  },

  deleteBooking: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await sequelize.transaction(async (t) => {
        const booking = await Booking.findByPk(id, {
          lock: true,
          transaction: t
        });

        if (!booking) {
          throw new Error('Booking not found');
        }

        const trip = await Trip.findByPk(booking.tripId, { transaction: t });

        if (booking.status !== 'cancelled') {
          await trip.update({
            availableSeats: trip.availableSeats + booking.seats
          }, { transaction: t });
        }

        await booking.destroy({ transaction: t });
        return booking;
      });

      return res.status(200).json({
        success: true,
        message: 'Booking deleted successfully'
      });

    } catch (error) {
      console.error('Delete booking error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete booking'
      });
    }
  },

  getBookingStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt[Op.gte] = new Date(startDate);
        if (endDate) dateFilter.createdAt[Op.lte] = new Date(endDate);
      }

      const [
        statusStats,
        totalBookings,
        totalRevenue,
        avgBookingValue,
        todayBookings,
        weeklyGrowth
      ] = await Promise.all([
        Booking.findAll({
          attributes: [
            'status',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
            [sequelize.fn('SUM', sequelize.col('seats')), 'totalSeats']
          ],
          where: dateFilter,
          group: ['status'],
          raw: true
        }),
        
        Booking.count({ where: dateFilter }),
        
        Booking.sum('amount', {
          where: { 
            ...dateFilter,
            status: { [Op.in]: ['confirmed', 'completed'] } 
          }
        }),
        
        Booking.findOne({
          attributes: [
            [sequelize.fn('AVG', sequelize.col('amount')), 'avgAmount']
          ],
          where: dateFilter,
          raw: true
        }),
        
        Booking.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        
        Promise.all([
          Booking.count({
            where: {
              createdAt: {
                [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          }),
          Booking.count({
            where: {
              createdAt: {
                [Op.gte]: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          })
        ])
      ]);

      const [thisWeek, lastWeek] = weeklyGrowth;
      const growthPercentage = lastWeek > 0 ? 
        ((thisWeek - lastWeek) / lastWeek * 100).toFixed(1) : 
        thisWeek > 0 ? 100 : 0;

      const completedBookings = statusStats.find(s => s.status === 'completed')?.count || 0;
      const completionRate = totalBookings > 0 ? 
        ((completedBookings / totalBookings) * 100).toFixed(1) : 0;

      return res.status(200).json({
        success: true,
        stats: {
          overview: {
            total: totalBookings,
            totalRevenue: totalRevenue || 0,
            averageBookingValue: parseFloat(avgBookingValue?.avgAmount || 0),
            todayBookings,
            completionRate: `${completionRate}%`
          },
          growth: {
            thisWeek,
            lastWeek,
            percentage: `${growthPercentage}%`,
            trend: parseFloat(growthPercentage) > 0 ? 'up' : 
                   parseFloat(growthPercentage) < 0 ? 'down' : 'stable'
          },
          byStatus: statusStats.map(stat => ({
            status: stat.status,
            count: parseInt(stat.count),
            totalAmount: parseFloat(stat.totalAmount || 0),
            totalSeats: parseInt(stat.totalSeats || 0),
            percentage: ((parseInt(stat.count) / totalBookings) * 100).toFixed(1) + '%'
          }))
        },
        period: {
          startDate: startDate || 'All time',
          endDate: endDate || 'Now'
        }
      });

    } catch (error) {
      console.error('Get booking stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking statistics'
      });
    }
  },

  getPassengerAnalytics: async (req, res) => {
    try {
      const userId = req.user.id;
      const { months = 12 } = req.query;

      const passenger = await Passenger.findOne({ where: { user_id: userId } });
      if (!passenger) {
        return res.status(404).json({
          success: false,
          message: 'Passenger profile not found'
        });
      }

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - parseInt(months));

      const [
        totalBookings,
        completedTrips,
        totalSpent,
        cancelledBookings,
        monthlyBreakdown
      ] = await Promise.all([
        Booking.count({
          where: {
            passengerId: passenger.id,
            createdAt: { [Op.gte]: startDate }
          }
        }),
        
        Booking.count({
          where: {
            passengerId: passenger.id,
            status: 'completed',
            createdAt: { [Op.gte]: startDate }
          }
        }),
        
        Booking.sum('amount', {
          where: {
            passengerId: passenger.id,
            status: { [Op.in]: ['confirmed', 'completed'] },
            createdAt: { [Op.gte]: startDate }
          }
        }),
        
        Booking.count({
          where: {
            passengerId: passenger.id,
            status: 'cancelled',
            createdAt: { [Op.gte]: startDate }
          }
        }),
        
        Booking.findAll({
          attributes: [
            [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'month'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'bookings'],
            [sequelize.fn('SUM', sequelize.col('amount')), 'spent']
          ],
          where: {
            passengerId: passenger.id,
            createdAt: { [Op.gte]: startDate }
          },
          group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at'))],
          order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('created_at')), 'ASC']],
          raw: true
        })
      ]);

      const completionRate = totalBookings > 0 ? 
        ((completedTrips / totalBookings) * 100).toFixed(1) : 0;
      
      const cancellationRate = totalBookings > 0 ? 
        ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0;

      return res.status(200).json({
        success: true,
        analytics: {
          summary: {
            totalBookings,
            completedTrips,
            totalSpent: totalSpent || 0,
            averageSpentPerTrip: completedTrips > 0 ? 
              ((totalSpent || 0) / completedTrips).toFixed(2) : 0,
            completionRate: `${completionRate}%`,
            cancellationRate: `${cancellationRate}%`
          },
          monthlyBreakdown: monthlyBreakdown.map(month => ({
            month: new Date(month.month).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long' 
            }),
            bookings: parseInt(month.bookings),
            spent: parseFloat(month.spent || 0)
          }))
        },
        period: `Last ${months} months`
      });

    } catch (error) {
      console.error('Get passenger analytics error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve passenger analytics'
      });
    }
  }
};

module.exports = bookingController;