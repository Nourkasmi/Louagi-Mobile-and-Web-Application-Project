const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const tripController = require('../controllers/trip.controller');
const auth = require('../middlewares/auth.middleware');

const requireDriver = [auth.authenticate, auth.hasRole('driver')];

/**
 * @route POST /api/drivers/available
 * @desc Driver declares availability (with enhanced validation)
 */
router.post('/available', requireDriver, driverController.declareAvailability);

/**
 * ✅ NEW: Get driver's current status
 * @route GET /api/drivers/status
 * @desc Get driver's current trip and queue status
 */
router.get('/status', requireDriver, driverController.getDriverStatus);

/**
 * @route GET /api/drivers/trips
 * @desc Get all trips assigned to the logged-in driver
 */
router.get('/trips', requireDriver, tripController.getDriverTrips);

/**
 * @route PATCH /api/drivers/trips/:id/complete
 * @desc Mark a trip as "completed"
 */
router.patch('/trips/:id/complete', requireDriver, tripController.completeTrip);

/**
 * @route GET /api/drivers/profile
 * @desc View current driver profile
 */
router.get('/profile', requireDriver, driverController.getProfile);

module.exports = router;