const { Driver, Station, Schedule, Destination, Trip, DriverQueue } = require('../models');
const { Op } = require('sequelize');
const queueUtils = require('../utils/queue.utils');
const { v4: uuidv4 } = require('uuid');

const driverController = {

  /**
   * Driver declares availability → enters queue → may trigger trip
   */
  declareAvailability: async (req, res) => {
    try {
      // ✅ Get the authenticated user (from auth middleware)
      const userId = req.user.id;

      // ✅ Find the driver profile linked to this user
      const driver = await Driver.findOne({ where: { user_id: userId } });

      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver profile not found' });
      }

      const driverId = driver.id;
      const { stationId, scheduleId, destinationId: bodyDestinationId } = req.body;

      // ✅ Validate station and schedule existence
      const station = await Station.findByPk(stationId);
      const schedule = await Schedule.findByPk(scheduleId);

      if (!station || !schedule) {
        return res.status(404).json({ success: false, message: 'Station or Schedule not found' });
      }

      // ✅ Validate schedule is active today
      const today = new Date().getDay();
      if (schedule.dayOfWeek !== today || !schedule.isActive) {
        return res.status(400).json({ success: false, message: 'Schedule is not active today' });
      }

      // ✅ Check time validity
      if (!queueUtils.isWithinScheduleTime(schedule)) {
        return res.status(400).json({ success: false, message: 'Outside schedule hours' });
      }

      // ✅ Prevent duplicate queue entry
      const alreadyInQueue = await DriverQueue.findOne({
        where: { driverId, scheduleId }
      });

      if (alreadyInQueue) {
        return res.status(409).json({ success: false, message: 'Driver already in queue' });
      }

      // ✅ Check eligibility to re-enter queue
      const { eligible, lastTrip, timeLeft } = await queueUtils.isDriverEligible(driverId, stationId);

      console.log('Last trip:', lastTrip?.status || 'None');
      console.log('Enough time left today:', timeLeft);

      if (!eligible) {
        return res.status(403).json({ success: false, message: 'Driver not eligible to re-enter queue yet' });
      }

      // ✅ If destinationId not provided, find active destination for this station
      let destinationId = bodyDestinationId;
      if (!destinationId) {
        const destination = await Destination.findOne({
          where: {
            startId: stationId,
            isActive: true
          }
        });

        if (!destination) {
          return res.status(404).json({ success: false, message: 'No active destination found for this station' });
        }
        destinationId = destination.id;
      }

      // ✅ Get next available queue position
      const position = await queueUtils.getNextQueuePosition(stationId, scheduleId, destinationId);

      // ✅ Create new queue entry with destinationId
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

      // ✅ Attempt to generate a trip
      const trip = await queueUtils.tryGenerateTripFromQueue?.(stationId, scheduleId, destinationId);

      return res.status(201).json({
        success: true,
        message: trip ? 'Trip created and assigned' : 'Driver added to queue. Waiting for conditions.',
        trip: trip || null
      });

    } catch (error) {
      console.error('Declare availability error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
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
