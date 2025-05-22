const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const paramMiddleware = require('../middlewares/param.middleware');

/**
 * User routes
 */

// Admin: Get all users
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  userController.getAllUsers
);

// Get user by ID (self or admin)
router.get(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.isOwnerOrAdmin((req) => req.params.id),
  paramMiddleware.validateUUID('id'),
  userController.getUserById
);

// Update user by ID (self or admin)
router.put(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.isOwnerOrAdmin((req) => req.params.id),
  paramMiddleware.validateUUID('id'),
  userController.updateUser
);

// Admin: Delete user
router.delete(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  paramMiddleware.validateUUID('id'),
  userController.deleteUser
);

module.exports = router;
