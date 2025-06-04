const { Driver, Station, Schedule, Destination, Trip, DriverQueue } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../models');

const driverController = {
  /**
   * ✅ ENHANCED: Driver declares availability → Position 1 → Instant Trip Assignment
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

      // ✅ VALIDATE: Within schedule time
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (nowMinutes < startMinutes || nowMinutes > endMinutes) {
        return res.status(400).json({ 
          success: false, 
          message: 'Outside schedule hours' 
        });
      }

      // ✅ MAIN LOGIC: Add to queue as Position 1 + Create Trip Instantly
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

        // 3️⃣ CREATE TRIP IMMEDIATELY FOR THIS DRIVER
        const departureTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
        const estimatedArrivalTime = new Date(
          departureTime.getTime() + (destination.estimatedDuration * 60 * 1000)
        );

        const basePrice = parseFloat(destination.basePrice);
        const currentPrice = parseFloat((basePrice * 1.2).toFixed(2)); // 20% markup

        const trip = await Trip.create({
          id: uuidv4(),
          routeId: destinationId,
          scheduleId,
          driverId,
          queueId: queueEntry.id,
          departureTime,
          estimatedArrivalTime,
          basePrice,
          currentPrice,
          capacity: driver.vehicle_capacity || 4,
          availableSeats: driver.vehicle_capacity || 4,
          status: 'scheduled',
          notes: 'Auto-assigned to position 1 driver'
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
        message: 'Driver added as #1 in queue and trip assigned instantly!',
        trip: completeTrip,
        queuePosition: 1,
        status: 'assigned',
        departureTime: result.trip.departureTime,
        instantAssignment: true
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
   * ✅ Get driver's current status (trip + queue info)
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

      // Determine availability status
      let availabilityStatus = 'available';
      let statusMessage = 'Available to declare availability';

      if (activeTrip) {
        availabilityStatus = 'busy';
        statusMessage = `Currently on trip (${activeTrip.status})`;
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
          canDeclareAvailability: availabilityStatus === 'available'
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
