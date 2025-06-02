const stripe = require('stripe');
const config = require('../config/config');
const { logger } = require('../utils/logger');

// Initialize Stripe with secret key
const stripeClient = stripe(config.payment.stripeSecretKey);

/**
 * Stripe Service for payment processing
 */
class StripeService {
  
  /**
   * Create a payment intent for booking
   * @param {Object} params - Payment parameters
   * @param {number} params.amount - Amount in cents
   * @param {string} params.currency - Currency code (default: 'usd')
   * @param {string} params.bookingId - Booking ID for metadata
   * @param {string} params.customerId - Stripe customer ID (optional)
   * @param {Object} params.metadata - Additional metadata
   * @returns {Object} Payment intent object
   */
  async createPaymentIntent({
    amount,
    currency = 'usd',
    bookingId,
    customerId,
    metadata = {}
  }) {
    try {
      const paymentIntentData = {
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          bookingId,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true
        }
      };

      // Add customer if provided
      if (customerId) {
        paymentIntentData.customer = customerId;
      }

      const paymentIntent = await stripeClient.paymentIntents.create(paymentIntentData);

      logger.info(`Payment intent created: ${paymentIntent.id} for booking: ${bookingId}`);
      
      return {
        success: true,
        paymentIntent,
        clientSecret: paymentIntent.client_secret
      };

    } catch (error) {
      logger.error('Stripe payment intent creation failed:', error);
      throw new Error(`Payment intent creation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Object} Payment intent object
   */
  async retrievePaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);
      return {
        success: true,
        paymentIntent
      };
    } catch (error) {
      logger.error('Failed to retrieve payment intent:', error);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Confirm payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @param {Object} params - Confirmation parameters
   * @returns {Object} Confirmed payment intent
   */
  async confirmPaymentIntent(paymentIntentId, params = {}) {
    try {
      const paymentIntent = await stripeClient.paymentIntents.confirm(
        paymentIntentId,
        params
      );

      logger.info(`Payment intent confirmed: ${paymentIntentId}`);
      
      return {
        success: true,
        paymentIntent
      };
    } catch (error) {
      logger.error('Payment confirmation failed:', error);
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }

  /**
   * Cancel payment intent
   * @param {string} paymentIntentId - Payment intent ID
   * @returns {Object} Cancelled payment intent
   */
  async cancelPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripeClient.paymentIntents.cancel(paymentIntentId);

      logger.info(`Payment intent cancelled: ${paymentIntentId}`);
      
      return {
        success: true,
        paymentIntent
      };
    } catch (error) {
      logger.error('Payment cancellation failed:', error);
      throw new Error(`Payment cancellation failed: ${error.message}`);
    }
  }

  /**
   * Create refund for payment
   * @param {Object} params - Refund parameters
   * @param {string} params.paymentIntentId - Payment intent ID
   * @param {number} params.amount - Refund amount in cents (optional, full refund if not specified)
   * @param {string} params.reason - Refund reason
   * @param {Object} params.metadata - Additional metadata
   * @returns {Object} Refund object
   */
  async createRefund({
    paymentIntentId,
    amount,
    reason = 'requested_by_customer',
    metadata = {}
  }) {
    try {
      const refundData = {
        payment_intent: paymentIntentId,
        reason,
        metadata
      };

      // Add amount if partial refund
      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripeClient.refunds.create(refundData);

      logger.info(`Refund created: ${refund.id} for payment: ${paymentIntentId}`);
      
      return {
        success: true,
        refund
      };
    } catch (error) {
      logger.error('Refund creation failed:', error);
      throw new Error(`Refund creation failed: ${error.message}`);
    }
  }

  /**
   * Create or retrieve Stripe customer
   * @param {Object} params - Customer parameters
   * @param {string} params.email - Customer email
   * @param {string} params.name - Customer name
   * @param {string} params.phone - Customer phone
   * @param {Object} params.metadata - Additional metadata
   * @returns {Object} Customer object
   */
  async createCustomer({
    email,
    name,
    phone,
    metadata = {}
  }) {
    try {
      // Check if customer already exists
      const existingCustomers = await stripeClient.customers.list({
        email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        logger.info(`Existing Stripe customer found: ${existingCustomers.data[0].id}`);
        return {
          success: true,
          customer: existingCustomers.data[0],
          isNew: false
        };
      }

      // Create new customer
      const customer = await stripeClient.customers.create({
        email,
        name,
        phone,
        metadata
      });

      logger.info(`New Stripe customer created: ${customer.id}`);
      
      return {
        success: true,
        customer,
        isNew: true
      };
    } catch (error) {
      logger.error('Customer creation failed:', error);
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve customer
   * @param {string} customerId - Customer ID
   * @returns {Object} Customer object
   */
  async retrieveCustomer(customerId) {
    try {
      const customer = await stripeClient.customers.retrieve(customerId);
      return {
        success: true,
        customer
      };
    } catch (error) {
      logger.error('Failed to retrieve customer:', error);
      throw new Error(`Failed to retrieve customer: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - Stripe signature header
   * @returns {Object} Webhook event
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const event = stripeClient.webhooks.constructEvent(
        payload,
        signature,
        config.payment.stripeWebhookSecret
      );

      logger.info(`Webhook event verified: ${event.type}`);
      
      return {
        success: true,
        event
      };
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }

  /**
   * Calculate processing fee
   * @param {number} amount - Amount in dollars
   * @param {string} currency - Currency code
   * @returns {Object} Fee calculation
   */
  calculateProcessingFee(amount, currency = 'usd') {
    // Stripe standard pricing: 2.9% + 30¢ for US cards
    const percentageFee = amount * 0.029;
    const fixedFee = currency.toLowerCase() === 'usd' ? 0.30 : 0;
    const totalFee = percentageFee + fixedFee;
    const netAmount = amount - totalFee;

    return {
      originalAmount: amount,
      processingFee: Math.round(totalFee * 100) / 100, // Round to 2 decimals
      netAmount: Math.round(netAmount * 100) / 100,
      feePercentage: 2.9,
      fixedFee
    };
  }

  /**
   * Get payment methods for customer
   * @param {string} customerId - Customer ID
   * @returns {Object} Payment methods
   */
  async getPaymentMethods(customerId) {
    try {
      const paymentMethods = await stripeClient.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return {
        success: true,
        paymentMethods: paymentMethods.data
      };
    } catch (error) {
      logger.error('Failed to retrieve payment methods:', error);
      throw new Error(`Failed to retrieve payment methods: ${error.message}`);
    }
  }

  /**
   * Create setup intent for saving payment method
   * @param {string} customerId - Customer ID
   * @returns {Object} Setup intent
   */
  async createSetupIntent(customerId) {
    try {
      const setupIntent = await stripeClient.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      return {
        success: true,
        setupIntent,
        clientSecret: setupIntent.client_secret
      };
    } catch (error) {
      logger.error('Setup intent creation failed:', error);
      throw new Error(`Setup intent creation failed: ${error.message}`);
    }
  }

  /**
   * Convert webhook event to payment status
   * @param {string} eventType - Stripe webhook event type
   * @returns {string} Payment status
   */
  getPaymentStatusFromEvent(eventType) {
    const statusMap = {
      'payment_intent.created': 'pending',
      'payment_intent.processing': 'processing',
      'payment_intent.succeeded': 'completed',
      'payment_intent.payment_failed': 'failed',
      'payment_intent.canceled': 'cancelled',
      'charge.dispute.created': 'disputed',
      'invoice.payment_succeeded': 'completed',
      'invoice.payment_failed': 'failed'
    };

    return statusMap[eventType] || 'unknown';
  }
}

module.exports = new StripeService();