const express = require('express');
const router = express.Router();

const stationController = require('../controllers/station.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const paramMiddleware = require('../middlewares/param.middleware');

// Public routes
router.get('/', stationController.getAllStations);

router.get(
  '/:id',
  paramMiddleware.validateUUID('id'),
  stationController.getStationById
);

// Admin-only routes
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
  paramMiddleware.validateUUID('id'),
  stationController.updateStation
);

router.delete(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  paramMiddleware.validateUUID('id'),
  stationController.deleteStation
);

module.exports = router;
