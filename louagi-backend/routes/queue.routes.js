const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queue.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateUUID } = require('../middlewares/param.middleware');

// ✅ DRIVER: Declare availability
router.post(
  '/available',
  authMiddleware.authenticate,
  authMiddleware.hasRole('driver'),
  queueController.declareAvailability
);

// ✅ NEW: DRIVER: Leave queue (the missing route!)
router.post(
  '/leave',
  authMiddleware.authenticate,
  authMiddleware.hasRole('driver'),
  queueController.leaveQueue
);

// ✅ ADMIN: View queue by station, schedule, destination
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  queueController.getQueueByStationSchedule
);

// ✅ ADMIN: Update queue position or status
router.patch(
  '/:id',
  validateUUID('id'),
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  queueController.updateQueueEntry
);

// ✅ ADMIN: Count queues per station
router.get(
  '/count',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  queueController.countQueuesByStation
);

// ✅ ADMIN: Get all queues in a station
router.get(
  '/all',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  queueController.getAllQueuesByStation
);

module.exports = router;