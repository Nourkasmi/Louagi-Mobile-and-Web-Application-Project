const { Booking, Trip, Passenger, Destination, Schedule, Driver, User, DriverQueue } = require('../models');
const { Op } = require('sequelize');
const { validateBooking, validateBookingUpdate, validateBulkBookingUpdate } = require('../middlewares/validate.middleware');
const { sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * ✅ NEW HELPER: Reindex queue positions after driver removal
 */
async function reindexQueuePositions(stationId, scheduleId, destinationId, transaction) {
  if (!stationId || !scheduleId || !destinationId) {
    console.log('⚠️ Missing queue identifiers, skipping reindex');
    return;
  }

  // Get all waiting drivers for this route, ordered by position
  const waitingDrivers = await DriverQueue.findAll({
    where: {
      stationId,
      scheduleId,
      destinationId,
      status: 'waiting'
    },
    order: [['position', 'ASC']],
    transaction
  });

  // Reindex positions (1, 2, 3, ...)
  for (let i = 0; i < waitingDrivers.length; i++) {
    const newPosition = i + 1;
    if (waitingDrivers[i].position !== newPosition) {
      await waitingDrivers[i].update({ 
        position: newPosition 
      }, { transaction });
    }
  }

  console.log(`✅ Reindexed ${waitingDrivers.length} queue positions`);
}

const bookingController = {
  /**
   * ✅ ENHANCED: Create booking + auto-start when full
   */
  createBooking: async (req, res) => {
    try {
      const { error } = validateBooking(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { tripId, seats = 1, specialRequests } = req.body;
      const userId = req.user.id;

      // Get passenger profile
      const passenger = await Passenger.findOne({ where: { user_id: userId } });
      if (!passenger) {
        return res.status(404).json({
          success: false,
          message: 'Passenger profile not found'
        });
      }

      // Use transaction to ensure data consistency
      const result = await sequelize.transaction(async (t) => {
        // Get trip with lock to prevent race conditions
        const trip = await Trip.findByPk(tripId, {
          include: [
            { model: Destination, as: 'route' },
            { model: Schedule, as: 'schedule' },
            { model: Driver, as: 'driver' },
            { model: DriverQueue, as: 'queueEntry' } // ✅ NEW: Include queue entry
          ],
          lock: true,
          transaction: t
        });

        if (!trip) {
          throw new Error('Trip not found');
        }

        // Check trip status
        if (trip.status !== 'scheduled') {
          throw new Error('Trip is not available for booking');
        }

        // Check if trip is in the future
        if (new Date(trip.departureTime) <= new Date()) {
          throw new Error('Cannot book trips that have already departed');
        }

        // Check seat availability
        if (trip.availableSeats < seats) {
          throw new Error(`Only ${trip.availableSeats} seats available`);
        }

        // Check for duplicate booking (same passenger, same trip)
        const existingBooking = await Booking.findOne({
          where: {
            tripId,
            passengerId: passenger.id,
            status: { [Op.notIn]: ['cancelled'] }
          },
          transaction: t
        });

        if (existingBooking) {
          throw new Error('You already have a booking for this trip');
        }

        // Calculate total amount
        const pricePerSeat = parseFloat(trip.currentPrice);
        const totalAmount = pricePerSeat * seats;

        // Create booking
        const booking = await Booking.create({
          tripId,
          passengerId: passenger.id,
          seats,
          amount: totalAmount,
          specialRequests,
          status: 'pending',
          paymentStatus: 'pending'
        }, { transaction: t });

        // Update trip available seats
        const newAvailableSeats = trip.availableSeats - seats;
        await trip.update({
          availableSeats: newAvailableSeats
        }, { transaction: t });

        // ✅ NEW: Auto-start trip if fully booked
        let wasAutoStarted = false;
        if (newAvailableSeats === 0) {
          console.log(`🚗 Trip ${tripId} is now FULL! Auto-starting...`);
          
          // Update trip status to in_progress
          await trip.update({
            status: 'in_progress',
            actualDepartureTime: new Date()
          }, { transaction: t });

          // Remove driver from queue and reindex positions
          if (trip.queueEntry) {
            const { stationId, scheduleId, destinationId } = trip.queueEntry;
            
            // Remove queue entry
            await trip.queueEntry.destroy({ transaction: t });
            
            // Reindex remaining queue positions
            await reindexQueuePositions(stationId, scheduleId, destinationId, t);
            
            console.log(`✅ Driver removed from queue, positions reindexed`);
          }

          // Auto-confirm all pending bookings for this trip
          await Booking.update(
            { 
              status: 'confirmed',
              paymentStatus: 'completed' // Assuming payment is processed
            },
            { 
              where: { tripId, status: 'pending' },
              transaction: t 
            }
          );

          wasAutoStarted = true;
          console.log(`✅ Trip ${tripId} auto-started with full capacity`);
        }

        return { booking, wasAutoStarted };
      });

      // Fetch complete booking data
      const completeBooking = await Booking.findByPk(result.booking.id, {
        include: [
          {
            model: Trip,
            as: 'trip',
            include: [
              { model: Destination, as: 'route' },
              { model: Schedule, as: 'schedule' }
            ]
          },
          {
            model: Passenger,
            as: 'passenger',
            include: [{ model: User, as: 'user', attributes: ['username', 'email', 'phone'] }]
          }
        ]
      });

      return res.status(201).json({
        success: true,
        booking: completeBooking,
        message: result.wasAutoStarted 
          ? 'Booking created and trip auto-started (fully booked!)' 
          : 'Booking created successfully',
        tripAutoStarted: result.wasAutoStarted
      });

    } catch (error) {
      console.error('Create booking error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to create booking'
      });
    }
  },

  /**
   * Get all bookings with filtering and pagination
   */
  getAllBookings: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const { status, tripId, passengerId, search, sortBy, order } = req.query;

      const whereClause = {};

      if (status) whereClause.status = status;
      if (tripId) whereClause.tripId = tripId;
      if (passengerId) whereClause.passengerId = passengerId;

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
              { model: Schedule, as: 'schedule' }
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

      return res.status(200).json({
        success: true,
        bookings: rows,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
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
   * Get passenger's own bookings
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

      const { status } = req.query;
      const whereClause = { passengerId: passenger.id };
      if (status) whereClause.status = status;

      const { count, rows } = await Booking.findAndCountAll({
        where: whereClause,
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
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        bookings: rows,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
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
   * Get all bookings for a specific trip
   */
  getBookingsByTrip: async (req, res) => {
    try {
      const { tripId } = req.params;
      const userId = req.user.id;

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

      const summary = {
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
        totalSeats: bookings.reduce((sum, b) => sum + b.seats, 0),
        confirmedSeats: bookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + b.seats, 0),
        totalRevenue: bookings.filter(b => ['confirmed', 'completed'].includes(b.status)).reduce((sum, b) => sum + parseFloat(b.amount), 0)
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
   * Update booking status
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
        const booking = await Booking.findByPk(id, {
          include: [{ model: Trip, as: 'trip' }],
          lock: true,
          transaction: t
        });

        if (!booking) {
          throw new Error('Booking not found');
        }

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

        if (status === 'cancelled' && booking.status !== 'cancelled') {
          await booking.trip.update({
            availableSeats: booking.trip.availableSeats + booking.seats
          }, { transaction: t });
        }

        const updateData = { status };
        if (status === 'cancelled' && cancellationReason) {
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
   * Cancel booking (passenger only)
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
        const booking = await Booking.findOne({
          where: {
            id,
            passengerId: passenger.id
          },
          include: [{ model: Trip, as: 'trip' }],
          lock: true,
          transaction: t
        });

        if (!booking) {
          throw new Error('Booking not found or you do not have permission to cancel it');
        }

        if (booking.status === 'cancelled') {
          throw new Error('Booking is already cancelled');
        }

        if (booking.status === 'completed') {
          throw new Error('Cannot cancel completed booking');
        }

        if (new Date(booking.trip.departureTime) <= new Date()) {
          throw new Error('Cannot cancel booking for trip that has already departed');
        }

        await booking.trip.update({
          availableSeats: booking.trip.availableSeats + booking.seats
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

  /**
   * Check in passenger (mark as confirmed)
   */
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

  /**
   * Mark passenger as no-show
   */
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

  /**
   * Bulk update booking statuses for a trip
   */
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

  /**
   * Get booking conflicts for a trip
   */
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

  /**
   * Delete booking (admin only)
   */
  deleteBooking: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await sequelize.transaction(async (t) => {
        const booking = await Booking.findByPk(id, {
          include: [{ model: Trip, as: 'trip' }],
          lock: true,
          transaction: t
        });

        if (!booking) {
          throw new Error('Booking not found');
        }

        if (booking.status !== 'cancelled') {
          await booking.trip.update({
            availableSeats: booking.trip.availableSeats + booking.seats
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

  /**
   * Get booking statistics (admin only)
   */
  getBookingStats: async (req, res) => {
    try {
      const stats = await Booking.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
          [sequelize.fn('SUM', sequelize.col('seats')), 'totalSeats']
        ],
        group: ['status'],
        raw: true
      });

      const totalBookings = await Booking.count();
      const totalRevenue = await Booking.sum('amount', {
        where: { status: { [Op.in]: ['confirmed', 'completed'] } }
      });

      return res.status(200).json({
        success: true,
        stats: {
          total: totalBookings,
          totalRevenue: totalRevenue || 0,
          byStatus: stats
        }
      });

    } catch (error) {
      console.error('Get booking stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking statistics'
      });
    }
  }
};

module.exports = bookingController;
