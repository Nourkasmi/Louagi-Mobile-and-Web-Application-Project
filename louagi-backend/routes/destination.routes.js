const express = require('express');
const router = express.Router();

const destinationController = require('../controllers/destination.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const paramMiddleware = require('../middlewares/param.middleware');

// Public routes
router.get('/', destinationController.getAllDestinations);

router.get(
  '/:id',
  paramMiddleware.validateUUID('id'),
  destinationController.getDestinationById
);

// Admin-only routes
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  destinationController.createDestination
);

router.put(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  paramMiddleware.validateUUID('id'),
  destinationController.updateDestination
);

router.delete(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  paramMiddleware.validateUUID('id'),
  destinationController.deleteDestination
);

module.exports = router;
