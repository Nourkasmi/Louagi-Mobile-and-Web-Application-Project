const { Driver, Station, Schedule, Destination, Trip, DriverQueue } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../models');

const driverController = {
  /**
   * ✅ UPDATED: Driver declares availability → Position 1 → Capacity-Based Trip Creation
   */
  declareAvailability: async (req, res) => {
    try {
      const userId = req.user.id;
      const { stationId, scheduleId, destinationId } = req.body;

      // Find the driver profile
      const driver = await Driver.findOne({ where: { user_id: userId } });
      if (!driver) {
        return res.status(404).json({ 
          success: false, 
          message: 'Driver profile not found' 
        });
      }

      const driverId = driver.id;

      // ✅ CHECK: Driver has no active trips
      const activeTrip = await Trip.findOne({
        where: {
          driverId,
          status: { [Op.in]: ['scheduled', 'in_progress'] }
        }
      });

      if (activeTrip) {
        return res.status(400).json({
          success: false,
          message: `Cannot declare availability. You have an active trip (${activeTrip.status})`,
          activeTrip: {
            id: activeTrip.id,
            status: activeTrip.status,
            departureTime: activeTrip.departureTime
          }
        });
      }

      // ✅ CHECK: Driver not already in queue
      const existingQueueEntry = await DriverQueue.findOne({
        where: { 
          driverId,
          status: { [Op.in]: ['waiting', 'assigned'] }
        }
      });

      if (existingQueueEntry) {
        return res.status(409).json({
          success: false,
          message: 'Driver already in queue or assigned to trip'
        });
      }

      // ✅ VALIDATE: Station, Schedule, Destination
      const [station, schedule, destination] = await Promise.all([
        Station.findByPk(stationId),
        Schedule.findByPk(scheduleId),
        Destination.findOne({
          where: {
            id: destinationId,
            startId: stationId,
            isActive: true
          }
        })
      ]);

      if (!station || !schedule || !destination) {
        return res.status(404).json({ 
          success: false, 
          message: 'Station, Schedule, or Destination not found or invalid' 
        });
      }

      // ✅ VALIDATE: Schedule is active today
      const today = new Date().getDay();
      if (schedule.dayOfWeek !== today || !schedule.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Schedule is not active today' 
        });
      }

      // ✅ REMOVED: Time-based validation - capacity system works anytime
      // No more schedule time checks - trips can be created anytime during the day

      // ✅ MAIN LOGIC: Add to queue as Position 1 + Create Capacity-Based Trip
      const result = await sequelize.transaction(async (t) => {
        
        // 1️⃣ MOVE EXISTING DRIVERS DOWN (position++)
        await DriverQueue.increment('position', {
          where: {
            stationId,
            scheduleId,
            destinationId,
            status: 'waiting'
          },
          transaction: t
        });

        // 2️⃣ ADD NEW DRIVER AS POSITION 1
        const queueEntry = await DriverQueue.create({
          id: uuidv4(),
          driverId,
          stationId,
          scheduleId,
          destinationId,
          position: 1,           // 🥇 ALWAYS POSITION 1
          status: 'assigned',    // 🎯 IMMEDIATELY ASSIGNED
          joinedAt: new Date()
        }, { transaction: t });

        // 3️⃣ CREATE CAPACITY-BASED TRIP FOR THIS DRIVER
        // ✅ UPDATED: No fixed departure time - will be set when trip starts
        const basePrice = parseFloat(destination.basePrice);
        const currentPrice = parseFloat((basePrice * 1.2).toFixed(2)); // 20% markup

        const trip = await Trip.create({
          id: uuidv4(),
          routeId: destinationId,
          scheduleId,
          driverId,
          queueId: queueEntry.id,
          departureTime: null,              // ✅ No fixed departure time
          estimatedArrivalTime: null,       // ✅ Will be calculated when trip starts
          basePrice,
          currentPrice,
          capacity: driver.vehicle_capacity || 4,
          availableSeats: driver.vehicle_capacity || 4,
          status: 'scheduled',
          notes: 'Waiting for passengers - will start when full'
        }, { transaction: t });

        return { trip, queueEntry };
      });

      // ✅ FETCH COMPLETE TRIP DATA
      const completeTrip = await Trip.findByPk(result.trip.id, {
        include: [
          { model: Destination, as: 'route' },
          { model: Schedule, as: 'schedule' },
          { model: Driver, as: 'driver' },
          { model: DriverQueue, as: 'queueEntry' }
        ]
      });

      return res.status(201).json({
        success: true,
        message: 'Trip created! Waiting for passengers to fill all seats.',
        trip: completeTrip,
        queuePosition: 1,
        status: 'assigned',
        waitingForPassengers: true,
        availableSeats: completeTrip.availableSeats,
        totalCapacity: completeTrip.capacity,
        systemType: 'capacity-based',
        note: 'Trip will start automatically when all seats are booked'
      });

    } catch (error) {
      console.error('Declare availability error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  /**
   * ✅ ENHANCED: Get driver's current status (trip + queue info + capacity status)
   */
  getDriverStatus: async (req, res) => {
    try {
      const userId = req.user.id;

      const driver = await Driver.findOne({
        where: { user_id: userId },
        include: ['user']
      });

      if (!driver) {
        return res.status(404).json({ 
          success: false, 
          message: 'Driver profile not found' 
        });
      }

      // Check for active trip
      const activeTrip = await Trip.findOne({
        where: {
          driverId: driver.id,
          status: { [Op.in]: ['scheduled', 'in_progress'] }
        },
        include: [
          { model: Destination, as: 'route' },
          { model: Schedule, as: 'schedule' }
        ]
      });

      // Check for queue position
      const queueEntry = await DriverQueue.findOne({
        where: {
          driverId: driver.id,
          status: { [Op.in]: ['waiting', 'assigned'] }
        },
        include: [
          { model: Station, as: 'station' },
          { model: Destination, as: 'destination' },
          { model: Schedule, as: 'schedule' }
        ]
      });

      // ✅ ENHANCED: Capacity-based status determination
      let availabilityStatus = 'available';
      let statusMessage = 'Available to declare availability';
      let capacityInfo = null;

      if (activeTrip) {
        if (activeTrip.status === 'scheduled') {
          availabilityStatus = 'waiting_passengers';
          statusMessage = `Waiting for passengers (${activeTrip.availableSeats}/${activeTrip.capacity} seats available)`;
          capacityInfo = {
            availableSeats: activeTrip.availableSeats,
            totalCapacity: activeTrip.capacity,
            bookedSeats: activeTrip.capacity - activeTrip.availableSeats,
            percentageFull: Math.round(((activeTrip.capacity - activeTrip.availableSeats) / activeTrip.capacity) * 100)
          };
        } else if (activeTrip.status === 'in_progress') {
          availabilityStatus = 'on_trip';
          statusMessage = `Currently on trip (in progress)`;
        }
      } else if (queueEntry) {
        availabilityStatus = 'in_queue';
        statusMessage = `In queue at position ${queueEntry.position}`;
      }

      return res.status(200).json({ 
        success: true, 
        driver: {
          profile: driver,
          availabilityStatus,
          statusMessage,
          activeTrip: activeTrip || null,
          queueEntry: queueEntry || null,
          capacityInfo,
          canDeclareAvailability: availabilityStatus === 'available',
          systemType: 'capacity-based'
        }
      });

    } catch (error) {
      console.error('Get driver status error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  },

  /**
   * ✅ NEW: Get trip capacity status for active trip
   */
  getTripCapacityStatus: async (req, res) => {
    try {
      const userId = req.user.id;

      const driver = await Driver.findOne({ where: { user_id: userId } });
      if (!driver) {
        return res.status(404).json({ 
          success: false, 
          message: 'Driver profile not found' 
        });
      }

      // Find active trip
      const activeTrip = await Trip.findOne({
        where: {
          driverId: driver.id,
          status: 'scheduled' // Only for trips waiting for passengers
        },
        include: [
          { model: Destination, as: 'route' },
          { model: Schedule, as: 'schedule' },
          {
            model: require('../models').Booking,
            as: 'bookings',
            where: { status: { [Op.notIn]: ['cancelled'] } },
            required: false
          }
        ]
      });

      if (!activeTrip) {
        return res.status(404).json({
          success: false,
          message: 'No active trip waiting for passengers'
        });
      }

      const totalBookedSeats = activeTrip.bookings?.reduce((sum, booking) => sum + booking.seats, 0) || 0;
      const availableSeats = activeTrip.capacity - totalBookedSeats;
      const percentageFull = Math.round((totalBookedSeats / activeTrip.capacity) * 100);

      return res.status(200).json({
        success: true,
        trip: {
          id: activeTrip.id,
          route: activeTrip.route?.description,
          totalCapacity: activeTrip.capacity,
          bookedSeats: totalBookedSeats,
          availableSeats: availableSeats,
          percentageFull: percentageFull,
          bookingsCount: activeTrip.bookings?.length || 0,
          status: activeTrip.status,
          willStartWhenFull: true,
          estimatedStartTime: availableSeats === 0 ? 'Starting now!' : 'When all seats are booked'
        }
      });

    } catch (error) {
      console.error('Get trip capacity status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get trip capacity status'
      });
    }
  },

  /**
   * ✅ NEW: Cancel waiting trip (if no bookings yet)
   */
  cancelWaitingTrip: async (req, res) => {
    try {
      const userId = req.user.id;

      const driver = await Driver.findOne({ where: { user_id: userId } });
      if (!driver) {
        return res.status(404).json({ 
          success: false, 
          message: 'Driver profile not found' 
        });
      }

      const result = await sequelize.transaction(async (t) => {
        // Find the scheduled trip
        const trip = await Trip.findOne({
          where: {
            driverId: driver.id,
            status: 'scheduled'
          },
          include: [
            {
              model: require('../models').Booking,
              as: 'bookings',
              where: { status: { [Op.notIn]: ['cancelled'] } },
              required: false
            }
          ],
          transaction: t
        });

        if (!trip) {
          throw new Error('No scheduled trip found');
        }

        // Check if there are any active bookings
        if (trip.bookings && trip.bookings.length > 0) {
          throw new Error('Cannot cancel trip with existing bookings');
        }

        // Cancel the trip
        await trip.update({ 
          status: 'cancelled',
          notes: (trip.notes || '') + ' - Cancelled by driver before any bookings'
        }, { transaction: t });

        // Remove from queue
        if (trip.queueId) {
          const queueEntry = await DriverQueue.findByPk(trip.queueId, { transaction: t });
          if (queueEntry) {
            await queueEntry.destroy({ transaction: t });
          }
        }

        return trip;
      });

      return res.status(200).json({
        success: true,
        message: 'Trip cancelled successfully. You can declare availability again.',
        cancelledTrip: {
          id: result.id,
          status: result.status
        }
      });

    } catch (error) {
      console.error('Cancel waiting trip error:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel trip'
      });
    }
  },

  /**
   * Get driver profile
   */
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;

      const driver = await Driver.findOne({
        where: { user_id: userId },
        include: ['user']
      });

      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver profile not found' });
      }

      return res.status(200).json({ success: true, profile: driver });
    } catch (error) {
      console.error('Get driver profile error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

module.exports = driverController;