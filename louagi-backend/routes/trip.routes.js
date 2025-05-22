const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateUUID } = require('../middlewares/param.middleware');

// ✅ Public routes
router.get('/', tripController.getAllTrips);
router.get('/:id', validateUUID('id'), tripController.getTripById);

// ✅ Admin-only: create and delete trips
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

// ✅ Admin: Trigger automatic trip generation
router.post(
  '/generate',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  tripController.generateTripsFromSchedules
);

// ✅ Admin & Driver: update trip status
router.put(
  '/:id/status',
  validateUUID('id'),
  authMiddleware.authenticate,
  authMiddleware.hasRole(['admin', 'driver']),
  tripController.updateTripStatus
);

module.exports = router;
