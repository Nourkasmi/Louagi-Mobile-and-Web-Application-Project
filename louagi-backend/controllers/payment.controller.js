const { Payment, Booking, Trip, Passenger, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
const stripeService = require('../services/stripe.service');
const { logger } = require('../utils/logger');
const { validatePaymentIntent, validateRefund } = require('../middlewares/validate.middleware');

const paymentController = {
  /**
   * Create payment intent for booking
   * @route POST /api/payments/intent
   */
  createPaymentIntent: async (req, res) => {
    try {
      const { error } = validatePaymentIntent(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { bookingId, savePaymentMethod = false } = req.body;
      const userId = req.user.id;

      // Get booking with trip details
      const booking = await Booking.findByPk(bookingId, {
        include: [
          {
            model: Trip,
            as: 'trip',
            include: ['route', 'schedule']
          },
          {
            model: Passenger,
            as: 'passenger',
            include: [{ model: User, as: 'user' }]
          }
        ]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Verify ownership
      if (booking.passenger.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only create payments for your own bookings'
        });
      }

      // Check booking status
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: 'Payment not allowed for this booking status'
        });
      }

      // Check if payment already exists and is successful
      const existingPayment = await Payment.findOne({
        where: {
          bookingId,
          status: { [Op.in]: ['completed', 'processing'] }
        }
      });

      if (existingPayment) {
        return res.status(400).json({
          success: false,
          message: 'Payment already exists for this booking'
        });
      }

      const result = await sequelize.transaction(async (t) => {
        // Create or get Stripe customer
        const { customer } = await stripeService.createCustomer({
          email: booking.passenger.user.email,
          name: booking.passenger.user.username,
          phone: booking.passenger.user.phone,
          metadata: {
            userId: booking.passenger.user.id,
            passengerId: booking.passenger.id
          }
        });

        // Update passenger with Stripe customer ID if new
        if (!booking.passenger.stripeCustomerId) {
          await booking.passenger.update({
            stripeCustomerId: customer.id
          }, { transaction: t });
        }

        // Calculate fees
        const amount = parseFloat(booking.amount);
        const feeCalculation = stripeService.calculateProcessingFee(amount);

        // Create payment intent
        const { paymentIntent, clientSecret } = await stripeService.createPaymentIntent({
          amount,
          currency: 'usd',
          bookingId: booking.id,
          customerId: customer.id,
          metadata: {
            tripId: booking.trip.id,
            passengerId: booking.passenger.id,
            routeDescription: booking.trip.route?.description || 'Trip',
            departureTime: booking.trip.departureTime
          }
        });

        // Create payment record
        const payment = await Payment.create({
          bookingId: booking.id,
          stripePaymentIntentId: paymentIntent.id,
          amount,
          currency: 'usd',
          status: 'pending',
          paymentMethod: 'stripe',
          processingFee: feeCalculation.processingFee,
          netAmount: feeCalculation.netAmount,
          metadata: {
            stripeCustomerId: customer.id,
            feeCalculation,
            savePaymentMethod
          }
        }, { transaction: t });

        return {
          payment,
          clientSecret,
          paymentIntent
        };
      });

      return res.status(201).json({
        success: true,
        payment: {
          id: result.payment.id,
          amount: result.payment.amount,
          currency: result.payment.currency,
          status: result.payment.status,
          processingFee: result.payment.processingFee,
          netAmount: result.payment.netAmount
        },
        clientSecret: result.clientSecret,
        message: 'Payment intent created successfully'
      });

    } catch (error) {
      logger.error('Create payment intent error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment intent'
      });
    }
  },

  /**
   * Confirm payment intent
   * @route POST /api/payments/:id/confirm
   */
  confirmPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { paymentMethodId } = req.body;
      const userId = req.user.id;

      const payment = await Payment.findByPk(id, {
        include: [
          {
            model: Booking,
            as: 'booking',
            include: [
              {
                model: Passenger,
                as: 'passenger',
                include: [{ model: User, as: 'user' }]
              }
            ]
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Verify ownership
      if (payment.booking.passenger.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only confirm your own payments'
        });
      }

      if (payment.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Payment cannot be confirmed in current status'
        });
      }

      // Confirm payment with Stripe
      const confirmParams = {};
      if (paymentMethodId) {
        confirmParams.payment_method = paymentMethodId;
      }

      const { paymentIntent } = await stripeService.confirmPaymentIntent(
        payment.stripePaymentIntentId,
        confirmParams
      );

      // Update payment status
      await payment.update({
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'processing',
        paidAt: paymentIntent.status === 'succeeded' ? new Date() : null,
        stripeChargeId: paymentIntent.latest_charge || null
      });

      // Update booking if payment successful
      if (paymentIntent.status === 'succeeded') {
        await payment.booking.update({
          paymentStatus: 'completed',
          status: 'confirmed'
        });
      }

      return res.status(200).json({
        success: true,
        payment: {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          paidAt: payment.paidAt
        },
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status
        },
        message: 'Payment confirmation processed'
      });

    } catch (error) {
      logger.error('Confirm payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to confirm payment'
      });
    }
  },

  /**
   * Cancel payment
   * @route POST /api/payments/:id/cancel
   */
  cancelPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;

      const payment = await Payment.findByPk(id, {
        include: [
          {
            model: Booking,
            as: 'booking',
            include: [
              {
                model: Passenger,
                as: 'passenger',
                include: [{ model: User, as: 'user' }]
              }
            ]
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Verify ownership or admin role
      if (payment.booking.passenger.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only cancel your own payments'
        });
      }

      if (!['pending', 'processing'].includes(payment.status)) {
        return res.status(400).json({
          success: false,
          message: 'Payment cannot be cancelled in current status'
        });
      }

      const result = await sequelize.transaction(async (t) => {
        // Cancel payment with Stripe
        await stripeService.cancelPaymentIntent(payment.stripePaymentIntentId);

        // Update payment status
        await payment.update({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason || 'Cancelled by user'
        }, { transaction: t });

        // Update booking status
        await payment.booking.update({
          paymentStatus: 'cancelled'
        }, { transaction: t });

        return payment;
      });

      return res.status(200).json({
        success: true,
        payment: {
          id: result.id,
          status: result.status,
          cancelledAt: result.cancelledAt,
          cancellationReason: result.cancellationReason
        },
        message: 'Payment cancelled successfully'
      });

    } catch (error) {
      logger.error('Cancel payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cancel payment'
      });
    }
  },

  /**
   * Create refund
   * @route POST /api/payments/:id/refund
   */
  createRefund: async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = validateRefund(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { amount, reason } = req.body;

      const payment = await Payment.findByPk(id, {
        include: [
          {
            model: Booking,
            as: 'booking',
            include: [
              {
                model: Passenger,
                as: 'passenger',
                include: [{ model: User, as: 'user' }]
              }
            ]
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      if (payment.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Only completed payments can be refunded'
        });
      }

      // Check if already refunded
      const existingRefund = await Payment.findOne({
        where: {
          parentPaymentId: payment.id,
          status: 'completed'
        }
      });

      if (existingRefund) {
        return res.status(400).json({
          success: false,
          message: 'Payment has already been refunded'
        });
      }

      const result = await sequelize.transaction(async (t) => {
        // Create refund with Stripe
        const refundAmount = amount || parseFloat(payment.amount);
        const { refund } = await stripeService.createRefund({
          paymentIntentId: payment.stripePaymentIntentId,
          amount: refundAmount,
          reason: reason || 'requested_by_customer',
          metadata: {
            originalPaymentId: payment.id,
            bookingId: payment.bookingId
          }
        });

        // Create refund payment record
        const refundPayment = await Payment.create({
          bookingId: payment.bookingId,
          parentPaymentId: payment.id,
          stripeRefundId: refund.id,
          amount: -refundAmount, // Negative amount for refund
          currency: payment.currency,
          status: 'completed',
          paymentMethod: 'stripe_refund',
          paidAt: new Date(),
          metadata: {
            originalPaymentId: payment.id,
            refundReason: reason
          }
        }, { transaction: t });

        // Update original payment
        await payment.update({
          status: 'refunded'
        }, { transaction: t });

        // Update booking status
        await payment.booking.update({
          paymentStatus: 'refunded',
          status: 'cancelled'
        }, { transaction: t });

        return {
          refundPayment,
          refund
        };
      });

      return res.status(201).json({
        success: true,
        refund: {
          id: result.refundPayment.id,
          amount: Math.abs(result.refundPayment.amount),
          currency: result.refundPayment.currency,
          status: result.refundPayment.status,
          refundId: result.refund.id
        },
        message: 'Refund processed successfully'
      });

    } catch (error) {
      logger.error('Create refund error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process refund'
      });
    }
  },

  /**
   * Get payment by ID
   * @route GET /api/payments/:id
   */
  getPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const payment = await Payment.findByPk(id, {
        include: [
          {
            model: Booking,
            as: 'booking',
            include: [
              {
                model: Trip,
                as: 'trip',
                include: ['route', 'schedule']
              },
              {
                model: Passenger,
                as: 'passenger',
                include: [{ model: User, as: 'user' }]
              }
            ]
          },
          {
            model: Payment,
            as: 'refunds',
            where: { parentPaymentId: id },
            required: false
          }
        ]
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Payment not found'
        });
      }

      // Verify ownership or admin role
      if (payment.booking.passenger.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own payments'
        });
      }

      return res.status(200).json({
        success: true,
        payment: {
          id: payment.id,
          bookingId: payment.bookingId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          processingFee: payment.processingFee,
          netAmount: payment.netAmount,
          paidAt: payment.paidAt,
          cancelledAt: payment.cancelledAt,
          cancellationReason: payment.cancellationReason,
          createdAt: payment.createdAt,
          booking: {
            id: payment.booking.id,
            seats: payment.booking.seats,
            status: payment.booking.status,
            trip: {
              id: payment.booking.trip.id,
              departureTime: payment.booking.trip.departureTime,
              route: payment.booking.trip.route?.description
            }
          },
          refunds: payment.refunds || []
        }
      });

    } catch (error) {
      logger.error('Get payment error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment'
      });
    }
  },

  /**
   * Get user's payment history
   * @route GET /api/payments/my
   */
  getMyPayments: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      const { status } = req.query;

      // Get passenger profile
      const passenger = await Passenger.findOne({ where: { user_id: userId } });
      if (!passenger) {
        return res.status(404).json({
          success: false,
          message: 'Passenger profile not found'
        });
      }

      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }

      const { count, rows } = await Payment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Booking,
            as: 'booking',
            where: { passengerId: passenger.id },
            include: [
              {
                model: Trip,
                as: 'trip',
                include: ['route']
              }
            ]
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        payments: rows.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          paidAt: payment.paidAt,
          createdAt: payment.createdAt,
          booking: {
            id: payment.booking.id,
            seats: payment.booking.seats,
            trip: {
              departureTime: payment.booking.trip.departureTime,
              route: payment.booking.trip.route?.description
            }
          }
        })),
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });

    } catch (error) {
      logger.error('Get my payments error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment history'
      });
    }
  },

  /**
   * Stripe webhook handler
   * @route POST /api/payments/webhook
   */
  handleWebhook: async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'];
      const payload = req.body;

      // Verify webhook signature
      const { event } = stripeService.verifyWebhookSignature(payload, signature);

      logger.info(`Processing webhook event: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSucceeded(event.data.object);
          break;
        
        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object);
          break;
        
        case 'payment_intent.canceled':
          await handlePaymentCanceled(event.data.object);
          break;
        
        case 'charge.dispute.created':
          await handleChargeDispute(event.data.object);
          break;
        
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      return res.status(200).json({ received: true });

    } catch (error) {
      logger.error('Webhook handling error:', error);
      return res.status(400).json({
        success: false,
        message: 'Webhook handling failed'
      });
    }
  },

  /**
   * Get payment methods for user
   * @route GET /api/payments/methods
   */
  getPaymentMethods: async (req, res) => {
    try {
      const userId = req.user.id;

      // Get passenger with Stripe customer ID
      const passenger = await Passenger.findOne({ 
        where: { user_id: userId },
        include: [{ model: User, as: 'user' }]
      });

      if (!passenger || !passenger.stripeCustomerId) {
        return res.status(200).json({
          success: true,
          paymentMethods: [],
          message: 'No payment methods found'
        });
      }

      const { paymentMethods } = await stripeService.getPaymentMethods(passenger.stripeCustomerId);

      return res.status(200).json({
        success: true,
        paymentMethods: paymentMethods.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year
          } : null,
          created: pm.created
        }))
      });

    } catch (error) {
      logger.error('Get payment methods error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment methods'
      });
    }
  },

  /**
   * Create setup intent for saving payment method
   * @route POST /api/payments/setup-intent
   */
  createSetupIntent: async (req, res) => {
    try {
      const userId = req.user.id;

      // Get or create Stripe customer
      const user = await User.findByPk(userId);
      const passenger = await Passenger.findOne({ where: { user_id: userId } });

      if (!passenger) {
        return res.status(404).json({
          success: false,
          message: 'Passenger profile not found'
        });
      }

      let customerId = passenger.stripeCustomerId;

      if (!customerId) {
        const { customer } = await stripeService.createCustomer({
          email: user.email,
          name: user.username,
          phone: user.phone,
          metadata: { userId, passengerId: passenger.id }
        });

        customerId = customer.id;
        await passenger.update({ stripeCustomerId: customerId });
      }

      const { setupIntent, clientSecret } = await stripeService.createSetupIntent(customerId);

      return res.status(201).json({
        success: true,
        setupIntent: {
          id: setupIntent.id,
          clientSecret
        },
        message: 'Setup intent created successfully'
      });

    } catch (error) {
      logger.error('Create setup intent error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create setup intent'
      });
    }
  },

  /**
   * Get payment statistics (admin only)
   * @route GET /api/payments/stats
   */
  getPaymentStats: async (req, res) => {
    try {
      const stats = await Payment.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
          [sequelize.fn('AVG', sequelize.col('amount')), 'averageAmount']
        ],
        where: {
          paymentMethod: { [Op.ne]: 'stripe_refund' } // Exclude refunds from stats
        },
        group: ['status'],
        raw: true
      });

      const totalPayments = await Payment.count({
        where: { paymentMethod: { [Op.ne]: 'stripe_refund' } }
      });

      const totalRevenue = await Payment.sum('amount', {
        where: { 
          status: 'completed',
          paymentMethod: { [Op.ne]: 'stripe_refund' }
        }
      });

      const totalRefunds = await Payment.sum('amount', {
        where: { paymentMethod: 'stripe_refund' }
      });

      return res.status(200).json({
        success: true,
        stats: {
          total: totalPayments,
          totalRevenue: totalRevenue || 0,
          totalRefunds: Math.abs(totalRefunds || 0),
          netRevenue: (totalRevenue || 0) + (totalRefunds || 0),
          byStatus: stats
        }
      });

    } catch (error) {
      logger.error('Get payment stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve payment statistics'
      });
    }
  }
};

/**
 * Webhook event handlers
 */

async function handlePaymentSucceeded(paymentIntent) {
  try {
    const payment = await Payment.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: [{ model: Booking, as: 'booking' }]
    });

    if (payment) {
      await sequelize.transaction(async (t) => {
        await payment.update({
          status: 'completed',
          paidAt: new Date(),
          stripeChargeId: paymentIntent.latest_charge
        }, { transaction: t });

        await payment.booking.update({
          paymentStatus: 'completed',
          status: 'confirmed'
        }, { transaction: t });
      });

      logger.info(`Payment completed: ${payment.id}`);
    }
  } catch (error) {
    logger.error('Handle payment succeeded error:', error);
  }
}

async function handlePaymentFailed(paymentIntent) {
  try {
    const payment = await Payment.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: [{ model: Booking, as: 'booking' }]
    });

    if (payment) {
      await sequelize.transaction(async (t) => {
        await payment.update({
          status: 'failed',
          failureReason: paymentIntent.last_payment_error?.message || 'Payment failed'
        }, { transaction: t });

        await payment.booking.update({
          paymentStatus: 'failed'
        }, { transaction: t });
      });

      logger.info(`Payment failed: ${payment.id}`);
    }
  } catch (error) {
    logger.error('Handle payment failed error:', error);
  }
}

async function handlePaymentCanceled(paymentIntent) {
  try {
    const payment = await Payment.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: [{ model: Booking, as: 'booking' }]
    });

    if (payment) {
      await sequelize.transaction(async (t) => {
        await payment.update({
          status: 'cancelled',
          cancelledAt: new Date()
        }, { transaction: t });

        await payment.booking.update({
          paymentStatus: 'cancelled'
        }, { transaction: t });
      });

      logger.info(`Payment cancelled: ${payment.id}`);
    }
  } catch (error) {
    logger.error('Handle payment cancelled error:', error);
  }
}

async function handleChargeDispute(charge) {
  try {
    const payment = await Payment.findOne({
      where: { stripeChargeId: charge.id }
    });

    if (payment) {
      await payment.update({
        status: 'disputed',
        metadata: {
          ...payment.metadata,
          disputeReason: charge.dispute?.reason,
          disputeStatus: charge.dispute?.status
        }
      });

      logger.info(`Payment disputed: ${payment.id}`);
    }
  } catch (error) {
    logger.error('Handle charge dispute error:', error);
  }
}

module.exports = paymentController;