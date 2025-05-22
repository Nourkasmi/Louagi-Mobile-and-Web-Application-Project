const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/schedule.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateUUID } = require('../middlewares/param.middleware');


// Public routes
router.get('/', scheduleController.getAllSchedules);
router.get('/:id', validateUUID, scheduleController.getScheduleById);

// Admin-only routes
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  scheduleController.createSchedule
);

router.put(
  '/:id',
  validateUUID,
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  scheduleController.updateSchedule
);

router.delete(
  '/:id',
  validateUUID,
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  scheduleController.deleteSchedule
);

module.exports = router;
