const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateUUID } = require('../middlewares/param.middleware');

/**
 * Booking Routes
 */

// Public routes (for checking booking status by reference)
router.get('/reference/:reference', bookingController.getBookingByReference);

// Passenger routes - require authentication
router.use(authMiddleware.authenticate);

/**
 * @route POST /api/bookings
 * @desc Create a new booking
 * @access Passenger
 */
router.post('/', 
  authMiddleware.hasRole(['passenger', 'admin']), 
  bookingController.createBooking
);

/**
 * @route GET /api/bookings/my
 * @desc Get current user's bookings
 * @access Passenger
 */
router.get('/my', 
  authMiddleware.hasRole(['passenger']), 
  bookingController.getPassengerBookings
);

/**
 * @route PATCH /api/bookings/:id/cancel
 * @desc Cancel a booking (passenger can cancel their own)
 * @access Passenger (own bookings only)
 */
router.patch('/:id/cancel', 
  validateUUID('id'),
  authMiddleware.hasRole(['passenger', 'admin']),
  bookingController.cancelBooking
);

// Admin routes - require admin role
const requireAdmin = [authMiddleware.authenticate, authMiddleware.hasRole('admin')];

/**
 * @route GET /api/bookings
 * @desc Get all bookings with filtering and pagination
 * @access Admin
 */
router.get('/', 
  requireAdmin, 
  bookingController.getAllBookings
);

/**
 * @route GET /api/bookings/stats
 * @desc Get booking statistics
 * @access Admin
 */
router.get('/stats', 
  requireAdmin, 
  bookingController.getBookingStats
);

/**
 * @route GET /api/bookings/:id
 * @desc Get booking by ID
 * @access Admin, or Passenger (own booking only)
 */
router.get('/:id', 
  validateUUID('id'),
  authMiddleware.isOwnerOrAdmin(async (req) => {
    // Custom logic to check if user owns the booking
    const { Booking, Passenger } = require('../models');
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Passenger, as: 'passenger' }]
    });
    return booking?.passenger?.user_id;
  }),
  bookingController.getBookingById
);

/**
 * @route PATCH /api/bookings/:id/status
 * @desc Update booking status
 * @access Admin
 */
router.patch('/:id/status', 
  validateUUID('id'),
  requireAdmin,
  bookingController.updateBookingStatus
);

/**
 * @route DELETE /api/bookings/:id
 * @desc Delete a booking
 * @access Admin only
 */
router.delete('/:id', 
  validateUUID('id'),
  requireAdmin,
  bookingController.deleteBooking
);

// Driver routes - for trip-related booking management
const requireDriver = [authMiddleware.authenticate, authMiddleware.hasRole('driver')];

/**
 * @route GET /api/bookings/trip/:tripId
 * @desc Get all bookings for a specific trip
 * @access Driver (for their trips), Admin
 */
router.get('/trip/:tripId', 
  validateUUID('tripId'),
  authMiddleware.hasRole(['driver', 'admin']),
  bookingController.getBookingsByTrip
);

/**
 * @route PATCH /api/bookings/:id/check-in
 * @desc Mark passenger as checked in (driver can do this for their trips)
 * @access Driver, Admin
 */
router.patch('/:id/check-in', 
  validateUUID('id'),
  authMiddleware.hasRole(['driver', 'admin']),
  bookingController.checkInPassenger
);

/**
 * @route PATCH /api/bookings/:id/no-show
 * @desc Mark passenger as no-show
 * @access Driver, Admin
 */
router.patch('/:id/no-show', 
  validateUUID('id'),
  authMiddleware.hasRole(['driver', 'admin']),
  bookingController.markNoShow
);

/**
 * @route PATCH /api/bookings/trip/:tripId/bulk-update
 * @desc Bulk update booking statuses for a trip
 * @access Admin
 */
router.patch('/trip/:tripId/bulk-update', 
  validateUUID('tripId'),
  requireAdmin,
  bookingController.bulkUpdateBookingStatus
);

/**
 * @route GET /api/bookings/trip/:tripId/conflicts
 * @desc Get booking conflicts for a trip
 * @access Admin, Driver (for their trips)
 */
router.get('/trip/:tripId/conflicts', 
  validateUUID('tripId'),
  authMiddleware.hasRole(['driver', 'admin']),
  bookingController.getBookingConflicts
);

module.exports = router;
