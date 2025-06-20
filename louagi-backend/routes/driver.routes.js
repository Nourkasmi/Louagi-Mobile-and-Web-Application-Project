const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const tripController = require('../controllers/trip.controller');
const auth = require('../middlewares/auth.middleware');
const { validateUUID } = require('../middlewares/param.middleware');
const { Op } = require('sequelize');

const requireDriver = [auth.authenticate, auth.hasRole('driver')];

/**
 * ✅ UPDATED: Driver declares availability 
 * @route POST /api/drivers/available
 * @desc Driver declares availability with calculated departure times
 * @access Driver only
 * @body { stationId, scheduleId, destinationId }
 */
router.post('/available', requireDriver, driverController.declareAvailability);

/**
 * ✅ NEW: Driver declares car is full
 * @route POST /api/drivers/declare-full
 * @desc Start trip immediately (manual trigger)
 * @access Driver only
 */
router.post('/declare-full', requireDriver, driverController.declareFull);

/**
 * ✅ EXISTING: Get driver's current status
 * @route GET /api/drivers/status
 * @desc Get driver's current trip and queue status with timing info
 * @access Driver only
 */
router.get('/status', requireDriver, driverController.getDriverStatus);

/**
 * ✅ EXISTING: Get trip capacity status
 * @route GET /api/drivers/trip-capacity
 * @desc Get capacity status for driver's active trip
 * @access Driver only
 */
router.get('/trip-capacity', requireDriver, driverController.getTripCapacityStatus);

/**
 * ✅ EXISTING: Cancel waiting trip
 * @route POST /api/drivers/cancel-trip
 * @desc Cancel trip if no bookings yet
 * @access Driver only
 */
router.post('/cancel-trip', requireDriver, driverController.cancelWaitingTrip);

/**
 * @route GET /api/drivers/trips
 * @desc Get all trips assigned to the logged-in driver
 * @access Driver only
 */
router.get('/trips', requireDriver, tripController.getDriverTrips);

/**
 * ✅ ENHANCED: Mark a trip as completed
 * @route PATCH /api/drivers/trips/:id/complete
 * @desc Mark a trip as "completed" with queue cleanup
 * @access Driver only
 */
router.patch('/trips/:id/complete', 
  validateUUID('id'),
  requireDriver, 
  tripController.completeTrip
);

/**
 * ✅ ENHANCED: Update trip status
 * @route PATCH /api/drivers/trips/:id/status
 * @desc Update trip status (scheduled/in_progress/completed/cancelled)
 * @access Driver only
 * @body { status }
 */
router.patch('/trips/:id/status',
  validateUUID('id'),
  requireDriver,
  tripController.updateTripStatus
);

/**
 * @route GET /api/drivers/profile
 * @desc View current driver profile
 * @access Driver only
 */
router.get('/profile', requireDriver, driverController.getProfile);

/**
 * ✅ NEW: Get driver earnings summary
 * @route GET /api/drivers/earnings
 * @desc Get driver earnings for specified period
 * @access Driver only
 * @query { startDate?, endDate? }
 */
router.get('/earnings', requireDriver, async (req, res) => {
  try {
    const userId = req.user.id;
    const { calculateDriverEarnings } = require('../utils/system.helpers');
    
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days ago
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    const { Driver } = require('../models');
    const driver = await Driver.findOne({ where: { user_id: userId } });
    
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const earnings = await calculateDriverEarnings(driver.id, startDate, endDate);
    
    return res.status(200).json({
      success: true,
      earnings: {
        ...earnings,
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    console.error('Get driver earnings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate earnings'
    });
  }
});

/**
 * ✅ UPDATED: Get driver's queue position with timing info
 * @route GET /api/drivers/queue
 * @desc Get current queue position and estimated wait time
 * @access Driver only
 */
router.get('/queue', requireDriver, async (req, res) => {
  try {
    const userId = req.user.id;
    const { Driver, DriverQueue } = require('../models');
    
    const driver = await Driver.findOne({ where: { user_id: userId } });
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const queueEntry = await DriverQueue.findOne({
      where: {
        driverId: driver.id,
        status: { [Op.in]: ['waiting', 'assigned'] }
      },
      include: [
        { model: require('../models').Station, as: 'station' },
        { model: require('../models').Destination, as: 'destination' },
        { model: require('../models').Schedule, as: 'schedule' }
      ]
    });

    if (!queueEntry) {
      return res.status(200).json({
        success: true,
        inQueue: false,
        message: 'Driver not currently in any queue'
      });
    }

    const waitingTime = Math.round((new Date() - new Date(queueEntry.joinedAt)) / (1000 * 60));
    
    // ✅ UPDATED: Use time calculation for better estimates
    const { calculateTripTimes, formatTripTime } = require('../utils/time.utils');
    const timeCalculation = calculateTripTimes(
      queueEntry.schedule,
      queueEntry.position,
      queueEntry.destination
    );
    const departureFormatted = formatTripTime(timeCalculation.departureTime);

    return res.status(200).json({
      success: true,
      inQueue: true,
      queue: {
        position: queueEntry.position,
        status: queueEntry.status,
        waitingTimeMinutes: waitingTime,
        estimatedDepartureTime: timeCalculation.departureTime,
        formattedDepartureTime: departureFormatted.full,
        minutesUntilDeparture: timeCalculation.totalDelayFromNow,
        station: queueEntry.station?.name,
        destination: queueEntry.destination?.description,
        schedule: `${queueEntry.schedule?.startTime} - ${queueEntry.schedule?.endTime}`,
        scheduleStatus: timeCalculation.scheduleStatus
      }
    });
  } catch (error) {
    console.error('Get driver queue error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get queue information'
    });
  }
});

module.exports = router;