const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateUUID } = require('../middlewares/param.middleware');

/**
 * Payment Routes
 */

// Webhook route (no auth required, Stripe handles verification)
/**
 * @route POST /api/payments/webhook
 * @desc Stripe webhook endpoint
 * @access Public (verified by Stripe signature)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// All other routes require authentication
router.use(authMiddleware.authenticate);

/**
 * @route POST /api/payments/intent
 * @desc Create payment intent for booking
 * @access Passenger
 */
router.post('/intent', 
  authMiddleware.hasRole(['passenger', 'admin']), 
  paymentController.createPaymentIntent
);

/**
 * @route POST /api/payments/setup-intent
 * @desc Create setup intent for saving payment methods
 * @access Passenger
 */
router.post('/setup-intent', 
  authMiddleware.hasRole(['passenger', 'admin']), 
  paymentController.createSetupIntent
);

/**
 * @route GET /api/payments/methods
 * @desc Get user's saved payment methods
 * @access Passenger
 */
router.get('/methods', 
  authMiddleware.hasRole(['passenger', 'admin']), 
  paymentController.getPaymentMethods
);

/**
 * @route GET /api/payments/my
 * @desc Get current user's payment history
 * @access Passenger
 */
router.get('/my', 
  authMiddleware.hasRole(['passenger', 'admin']), 
  paymentController.getMyPayments
);

/**
 * @route GET /api/payments/stats
 * @desc Get payment statistics
 * @access Admin only
 */
router.get('/stats', 
  authMiddleware.hasRole('admin'), 
  paymentController.getPaymentStats
);

/**
 * @route GET /api/payments/:id
 * @desc Get payment by ID
 * @access Passenger (own payments), Admin (all payments)
 */
router.get('/:id', 
  validateUUID('id'),
  authMiddleware.hasRole(['passenger', 'admin']),
  paymentController.getPayment
);

/**
 * @route POST /api/payments/:id/confirm
 * @desc Confirm payment intent
 * @access Passenger (own payments), Admin
 */
router.post('/:id/confirm', 
  validateUUID('id'),
  authMiddleware.hasRole(['passenger', 'admin']),
  paymentController.confirmPayment
);

/**
 * @route POST /api/payments/:id/cancel
 * @desc Cancel payment
 * @access Passenger (own payments), Admin
 */
router.post('/:id/cancel', 
  validateUUID('id'),
  authMiddleware.hasRole(['passenger', 'admin']),
  paymentController.cancelPayment
);

/**
 * @route POST /api/payments/:id/refund
 * @desc Create refund for payment
 * @access Admin only
 */
router.post('/:id/refund', 
  validateUUID('id'),
  authMiddleware.hasRole('admin'),
  paymentController.createRefund
);

module.exports = router;
