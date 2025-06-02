const { Driver, Station, Schedule, Destination, Trip, DriverQueue } = require('../models');
const { Op } = require('sequelize');
const queueUtils = require('../utils/queue.utils');
const { v4: uuidv4 } = require('uuid');

const driverController = {
  /**
   * ✅ ENHANCED: Driver declares availability with active trip validation
   */
  declareAvailability: async (req, res) => {
    try {
      const userId = req.user.id;

      // Find the driver profile
      const driver = await Driver.findOne({ where: { user_id: userId } });
      if (!driver) {
        return res.status(404).json({ 
          success: false, 
          message: 'Driver profile not found' 
        });
      }

      const driverId = driver.id;
      const { stationId, scheduleId, destinationId: bodyDestinationId } = req.body;

      // ✅ NEW: Check if driver has any active trips
      const activeTrip = await Trip.findOne({
        where: {
          driverId,
          status: { [Op.in]: ['scheduled', 'in_progress'] }
        },
        include: [
          { model: Destination, as: 'route' },
          { model: Schedule, as: 'schedule' }
        ]
      });

      if (activeTrip) {
        return res.status(400).json({
          success: false,
          message: `Cannot declare availability. You have an active trip (${activeTrip.status})`,
          activeTrip: {
            id: activeTrip.id,
            status: activeTrip.status,
            departureTime: activeTrip.departureTime,
            route: `${activeTrip.route?.description || 'Unknown route'}`
          }
        });
      }

      // ✅ NEW: Check if driver is already in any queue
      const existingQueueEntry = await DriverQueue.findOne({
        where: { 
          driverId,
          status: { [Op.in]: ['waiting', 'assigned'] }
        },
        include: [
          { model: Station, as: 'station' },
          { model: Destination, as: 'destination' }
        ]
      });

      if (existingQueueEntry) {
        return res.status(409).json({
          success: false,
          message: 'Driver already in queue',
          currentQueue: {
            station: existingQueueEntry.station?.name,
            destination: existingQueueEntry.destination?.description,
            position: existingQueueEntry.position,
            status: existingQueueEntry.status
          }
        });
      }

      // Validate station and schedule existence
      const station = await Station.findByPk(stationId);
      const schedule = await Schedule.findByPk(scheduleId);

      if (!station || !schedule) {
        return res.status(404).json({ 
          success: false, 
          message: 'Station or Schedule not found' 
        });
      }

      // Validate schedule is active today
      const today = new Date().getDay();
      if (schedule.dayOfWeek !== today || !schedule.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Schedule is not active today' 
        });
      }

      // Check time validity
      if (!queueUtils.isWithinScheduleTime(schedule)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Outside schedule hours' 
        });
      }

      // Check eligibility to enter queue
      const { eligible, lastTrip, timeLeft } = await queueUtils.isDriverEligible(driverId, stationId);

      console.log('Last trip:', lastTrip?.status || 'None');
      console.log('Enough time left today:', timeLeft);

      if (!eligible) {
        return res.status(403).json({ 
          success: false, 
          message: 'Driver not eligible to enter queue yet' 
        });
      }

      // Find or validate destination
      let destinationId = bodyDestinationId;
      if (!destinationId) {
        const destination = await Destination.findOne({
          where: {
            startId: stationId,
            isActive: true
          }
        });

        if (!destination) {
          return res.status(404).json({ 
            success: false, 
            message: 'No active destination found for this station' 
          });
        }
        destinationId = destination.id;
      }

      // Get next available queue position
      const position = await queueUtils.getNextQueuePosition(stationId, scheduleId, destinationId);

      // Create new queue entry
      await DriverQueue.create({
        id: uuidv4(),
        driverId,
        stationId,
        scheduleId,
        destinationId,
        position,
        status: 'waiting',
        joinedAt: new Date()
      });

      // Attempt to generate a trip
      const trip = await queueUtils.tryGenerateTripFromQueue?.(stationId, scheduleId, destinationId);

      return res.status(201).json({
        success: true,
        message: trip ? 'Trip created and assigned' : 'Driver added to queue. Waiting for conditions.',
        queuePosition: position,
        trip: trip || null
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
   * ✅ NEW: Get driver's current status (trip + queue info)
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