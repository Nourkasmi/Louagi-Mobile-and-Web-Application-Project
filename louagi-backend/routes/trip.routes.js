const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateUUID } = require('../middlewares/param.middleware');

// CRITICAL: Specific routes MUST come before parameterized routes
// Otherwise Express treats "stats" as an ID parameter

//  Public routes (no authentication required)
router.get('/', tripController.getAllTrips);

//  NEW: Trip statistics endpoint - MUST be before /:id route
router.get('/stats', tripController.getTripStats);

//  Parameterized routes (MUST come after specific routes like /stats)
router.get('/:id', validateUUID('id'), tripController.getTripById);

//  Admin-only routes
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  tripController.createTrip
);

router.delete(
  '/:id',
  validateUUID('id'),
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  tripController.deleteTrip
);

//  Admin: Trigger automatic trip generation
router.post(
  '/generate',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  tripController.generateTripsFromSchedules
);

//  Admin & Driver: update trip status
router.put(
  '/:id/status',
  validateUUID('id'),
  authMiddleware.authenticate,
  authMiddleware.hasRole(['admin', 'driver']),
  tripController.updateTripStatus
);

//  Driver: Complete a trip
router.put(
  '/:id/complete',
  validateUUID('id'),
  authMiddleware.authenticate,
  authMiddleware.hasRole('driver'),
  tripController.completeTrip
);

module.exports = router;