const express = require('express');
const router = express.Router();
const stationController = require('../controllers/station.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Public
router.get('/', stationController.getAllStations);
router.get('/:id', stationController.getStationById);

// Admin only
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  stationController.createStation
);

router.put(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  stationController.updateStation
);

router.delete(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  stationController.deleteStation
);

module.exports = router;
