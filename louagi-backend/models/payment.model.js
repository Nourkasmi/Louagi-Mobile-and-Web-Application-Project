'use strict';

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    'Payment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id'
        },
        field: 'booking_id'
      },
      parentPaymentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'payments',
          key: 'id'
        },
        field: 'parent_payment_id',
        comment: 'For refunds, points to original payment'
      },
      stripePaymentIntentId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'stripe_payment_intent_id'
      },
      stripeChargeId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'stripe_charge_id'
      },
      stripeRefundId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'stripe_refund_id'
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      paymentMethod: {
        type: DataTypes.ENUM('stripe', 'stripe_refund', 'cash', 'bank_transfer'),
        allowNull: false,
        defaultValue: 'stripe',
        field: 'payment_method'
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'paid_at'
      },
      cancelledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'cancelled_at'
      },
      cancellationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'cancellation_reason'
      },
      failureReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'failure_reason'
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      processingFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'processing_fee',
        comment: 'Payment processing fee'
      },
      netAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        field: 'net_amount',
        comment: 'Amount after processing fees'
      }
    },
    {
      tableName: 'payments',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['booking_id'] },
        { fields: ['status'] },
        { fields: ['payment_method'] },
        { fields: ['created_at'] },
        { fields: ['paid_at'] },
        {
          fields: ['stripe_payment_intent_id'],
          unique: true,
          where: {
            stripe_payment_intent_id: {
              [sequelize.Sequelize.Op.ne]: null
            }
          },
          name: 'payments_stripe_payment_intent_id_unique'
        },
        { fields: ['stripe_charge_id'] },
        { fields: ['stripe_refund_id'] }
      ]
    }
  );

  Payment.associate = (models) => {
    // Payment belongs to a booking
    Payment.belongsTo(models.Booking, {
      foreignKey: 'bookingId',
      as: 'booking'
    });

    // Self-referencing for refunds
    Payment.belongsTo(models.Payment, {
      foreignKey: 'parentPaymentId',
      as: 'originalPayment'
    });

    Payment.hasMany(models.Payment, {
      foreignKey: 'parentPaymentId',
      as: 'refunds'
    });
  };

  // Instance methods
  Payment.prototype.isRefund = function() {
    return this.paymentMethod === 'stripe_refund';
  };

  Payment.prototype.canBeRefunded = function() {
    return this.status === 'completed' && !this.isRefund();
  };

  Payment.prototype.canBeCancelled = function() {
    return ['pending', 'processing'].includes(this.status);
  };

  // Class methods
  Payment.findByStripePaymentIntent = function(paymentIntentId) {
    return this.findOne({
      where: { stripePaymentIntentId: paymentIntentId },
      include: ['booking']
    });
  };

  Payment.findCompletedPayments = function(options = {}) {
    return this.findAll({
      where: {
        status: 'completed',
        paymentMethod: { [sequelize.Sequelize.Op.ne]: 'stripe_refund' },
        ...options.where
      },
      ...options
    });
  };

  Payment.calculateTotalRevenue = async function(dateRange = {}) {
    const whereClause = {
      status: 'completed',
      paymentMethod: { [sequelize.Sequelize.Op.ne]: 'stripe_refund' }
    };

    if (dateRange.startDate) {
      whereClause.paidAt = {
        [sequelize.Sequelize.Op.gte]: dateRange.startDate
      };
    }

    if (dateRange.endDate) {
      whereClause.paidAt = {
        ...whereClause.paidAt,
        [sequelize.Sequelize.Op.lte]: dateRange.endDate
      };
    }

    const result = await this.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalRevenue'],
        [sequelize.fn('SUM', sequelize.col('processing_fee')), 'totalFees'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions']
      ],
      where: whereClause,
      raw: true
    });

    return {
      totalRevenue: parseFloat(result.totalRevenue) || 0,
      totalFees: parseFloat(result.totalFees) || 0,
      totalTransactions: parseInt(result.totalTransactions) || 0,
      netRevenue: (parseFloat(result.totalRevenue) || 0) - (parseFloat(result.totalFees) || 0)
    };
  };

  // Hooks
  Payment.addHook('beforeCreate', (payment) => {
    // Ensure currency is uppercase
    if (payment.currency) {
      payment.currency = payment.currency.toUpperCase();
    }

    // Set paid_at for completed payments
    if (payment.status === 'completed' && !payment.paidAt) {
      payment.paidAt = new Date();
    }
  });

  Payment.addHook('beforeUpdate', (payment) => {
    // Set paid_at when status changes to completed
    if (payment.changed('status') && payment.status === 'completed' && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    // Set cancelled_at when status changes to cancelled
    if (payment.changed('status') && payment.status === 'cancelled' && !payment.cancelledAt) {
      payment.cancelledAt = new Date();
    }
  });

  return Payment;
};