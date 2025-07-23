const { Driver, Station, Schedule, Destination, Trip, DriverQueue } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../models');

const driverController = {
  /**
   *  UPDATED: Driver declares availability → Calculate times based on queue position
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

      //  CHECK: Driver has no active trips
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

      //  CHECK: Driver not already in queue
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

      //  VALIDATE: Station, Schedule, Destination
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

      //  VALIDATE: Schedule is active today
      const today = new Date().getDay();
      if (schedule.dayOfWeek !== today || !schedule.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Schedule is not active today' 
        });
      }

      //  MAIN LOGIC: Create trip with calculated times
      const result = await sequelize.transaction(async (t) => {
        
        //  GET CURRENT QUEUE COUNT (to determine position)
        const currentQueueCount = await DriverQueue.count({
          where: {
            stationId,
            scheduleId,
            destinationId,
            status: { [Op.in]: ['waiting', 'assigned'] }
          },
          transaction: t
        });
        
        const newPosition = currentQueueCount + 1;

        //  CALCULATE TRIP TIMES BASED ON QUEUE POSITION
        const { calculateTripTimes } = require('../utils/time.utils');
        const timeCalculation = calculateTripTimes(
          schedule, 
          newPosition, 
          destination
        );

        //  CREATE QUEUE ENTRY
        const queueEntry = await DriverQueue.create({
          id: uuidv4(),
          driverId,
          stationId,
          scheduleId,
          destinationId,
          position: newPosition,
          status: 'assigned',
          joinedAt: new Date()
        }, { transaction: t });

        //  CREATE TRIP WITH CALCULATED TIMES
        const basePrice = parseFloat(destination.basePrice);
        const currentPrice = parseFloat((basePrice * 1.2).toFixed(2));

        const trip = await Trip.create({
          id: uuidv4(),
          routeId: destinationId,
          scheduleId,
          driverId,
          queueId: queueEntry.id,
          departureTime: timeCalculation.departureTime,           // ✅ CALCULATED TIME
          estimatedArrivalTime: timeCalculation.estimatedArrivalTime, // ✅ CALCULATED TIME
          basePrice,
          currentPrice,
          capacity: driver.vehicle_capacity || 4,
          availableSeats: driver.vehicle_capacity || 4,
          status: 'scheduled',
          notes: `Queue position: ${newPosition}, Scheduled departure: ${timeCalculation.departureTime.toLocaleTimeString()}`
        }, { transaction: t });

        return { 
          trip, 
          queueEntry, 
          timeCalculation,
          position: newPosition
        };
      });

      //  FETCH COMPLETE TRIP DATA
      const completeTrip = await Trip.findByPk(result.trip.id, {
        include: [
          { model: Destination, as: 'route' },
          { model: Schedule, as: 'schedule' },
          { model: Driver, as: 'driver' },
          { model: DriverQueue, as: 'queueEntry' }
        ]
      });

      //  FORMAT RESPONSE WITH TIMING INFO
      const { formatTripTime, calculateDuration } = require('../utils/time.utils');
      const departureFormatted = formatTripTime(result.timeCalculation.departureTime);
      const arrivalFormatted = formatTripTime(result.timeCalculation.estimatedArrivalTime);
      const duration = calculateDuration(
        result.timeCalculation.departureTime, 
        result.timeCalculation.estimatedArrivalTime
      );

      return res.status(201).json({
        success: true,
        message: 'Trip created with scheduled departure time',
        trip: completeTrip,
        timing: {
          queuePosition: result.position,
          departureTime: result.timeCalculation.departureTime,
          estimatedArrivalTime: result.timeCalculation.estimatedArrivalTime,
          formattedDeparture: departureFormatted.full,
          formattedArrival: arrivalFormatted.full,
          duration: duration.readable,
          queueDelayMinutes: result.timeCalculation.queueDelayMinutes,
          totalDelayFromNow: result.timeCalculation.totalDelayFromNow,
          scheduleStatus: result.timeCalculation.scheduleStatus,
          isScheduleActive: result.timeCalculation.isScheduleActive
        },
        waitingForPassengers: true,
        availableSeats: completeTrip.availableSeats,
        totalCapacity: completeTrip.capacity,
        systemType: 'time-based',
        note: 'Trip will depart at scheduled time or when driver declares full'
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
   *  ENHANCED: Get driver's current status (trip + queue info + capacity status)
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

      //  ENHANCED: Status determination with timing info
      let availabilityStatus = 'available';
      let statusMessage = 'Available to declare availability';
      let capacityInfo = null;
      let timingInfo = null;

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
          
          // Add timing info for scheduled trips
          if (activeTrip.departureTime) {
            const { formatTripTime } = require('../utils/time.utils');
            const departureFormatted = formatTripTime(activeTrip.departureTime);
            const arrivalFormatted = formatTripTime(activeTrip.estimatedArrivalTime);
            
            timingInfo = {
              departureTime: activeTrip.departureTime,
              estimatedArrivalTime: activeTrip.estimatedArrivalTime,
              formattedDeparture: departureFormatted.full,
              formattedArrival: arrivalFormatted.full,
              minutesUntilDeparture: Math.max(0, Math.round((activeTrip.departureTime - new Date()) / (1000 * 60)))
            };
          }
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
          timingInfo,
          canDeclareAvailability: availabilityStatus === 'available',
          canDeclareFull: availabilityStatus === 'waiting_passengers',
          systemType: 'time-based'
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
   *  NEW: Get trip capacity status for active trip
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

      // Add timing info
      const { formatTripTime } = require('../utils/time.utils');
      const departureFormatted = formatTripTime(activeTrip.departureTime);
      const minutesUntilDeparture = Math.max(0, Math.round((activeTrip.departureTime - new Date()) / (1000 * 60)));

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
          departureTime: activeTrip.departureTime,
          formattedDeparture: departureFormatted.full,
          minutesUntilDeparture,
          canDeclareFull: true,
          willStartWhenFull: true,
          estimatedStartTime: availableSeats === 0 ? 'Starting now!' : departureFormatted.full
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
   *  NEW: Cancel waiting trip (if no bookings yet)
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
 *  NEW: Driver declares car is full (manual trip start)
 */
declareFull: async (req, res) => {
  try {
    const userId = req.user.id;
    const driver = await Driver.findOne({ where: { user_id: userId } });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    // Find driver's current scheduled trip
    const trip = await Trip.findOne({
      where: {
        driverId: driver.id,
        status: 'scheduled'
      },
      include: [
        { model: Destination, as: 'route' },
        { model: DriverQueue, as: 'queueEntry' },
        {
          model: require('../models').Booking,
          as: 'bookings',
          where: { status: { [Op.notIn]: ['cancelled'] } },
          required: false
        }
      ]
    });

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'No scheduled trip found'
      });
    }

    //  START TRIP IMMEDIATELY (manual trigger)
    const result = await sequelize.transaction(async (t) => {
      const now = new Date();
      const estimatedArrivalTime = new Date(
        now.getTime() + (trip.route.estimatedDuration * 60 * 1000)
      );

      // Update trip to start
      await trip.update({
        status: 'in_progress',
        actualDepartureTime: now,
        actualArrivalTime: estimatedArrivalTime, // Use actualArrivalTime instead of updating estimatedArrivalTime
        notes: (trip.notes || '') + ` - Started manually at ${now.toLocaleTimeString()} (driver declared full)`
      }, { transaction: t });

      // Remove from queue and update remaining queue times
      if (trip.queueEntry) {
        const { stationId, scheduleId, destinationId } = trip.queueEntry;
        
        // Remove this driver's queue entry
        await trip.queueEntry.destroy({ transaction: t });
        
        // Update remaining drivers' queue positions and trip times
        const { updateQueueTripTimes } = require('../utils/queue.utils');
        await updateQueueTripTimes(stationId, scheduleId, destinationId, t);
        
        console.log(` Driver removed from queue, remaining positions updated`);
      }

      return trip;
    });

    // Get booking count for response
    const bookingCount = trip.bookings?.length || 0;
    const bookedSeats = trip.bookings?.reduce((sum, booking) => sum + booking.seats, 0) || 0;

    return res.status(200).json({
      success: true,
      message: 'Trip started successfully',
      trip: {
        id: result.id,
        status: result.status,
        actualDepartureTime: result.actualDepartureTime,
        actualArrivalTime: result.actualArrivalTime,
        scheduledDepartureTime: result.departureTime, // Keep original for comparison
        route: trip.route?.description
      },
      passengers: {
        totalBookings: bookingCount,
        bookedSeats,
        availableSeats: trip.capacity - bookedSeats,
        capacity: trip.capacity
      },
      trigger: 'manual_full',
      departureType: 'early_manual'
    });

  } catch (error) {
    console.error('Declare full error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start trip'
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