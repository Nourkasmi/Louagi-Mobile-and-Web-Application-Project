const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * User routes
 */

// Admin routes
router.get(
  '/',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  userController.getAllUsers
);

// Get user by ID (user can get their own profile, admin can get any)
router.get(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.isOwnerOrAdmin((req) => req.params.id),
  userController.getUserById
);

// Update user (user can update their own profile, admin can update any)
router.put(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.isOwnerOrAdmin((req) => req.params.id),
  userController.updateUser
);

// Delete user (admin only)
router.delete(
  '/:id',
  authMiddleware.authenticate,
  authMiddleware.hasRole('admin'),
  userController.deleteUser
);

module.exports = router;