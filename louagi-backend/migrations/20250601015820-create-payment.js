'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'bookings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      parent_payment_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'payments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'For refunds, points to original payment'
      },
      stripe_payment_intent_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stripe_charge_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      stripe_refund_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_method: {
        type: Sequelize.ENUM('stripe', 'stripe_refund', 'cash', 'bank_transfer'),
        allowNull: false,
        defaultValue: 'stripe'
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancelled_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      processing_fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Payment processing fee'
      },
      net_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Amount after processing fees'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('payments', ['booking_id']);
    await queryInterface.addIndex('payments', ['status']);
    await queryInterface.addIndex('payments', ['payment_method']);
    await queryInterface.addIndex('payments', ['created_at']);
    await queryInterface.addIndex('payments', ['paid_at']);
    
    // Add unique index for Stripe payment intent ID (when not null)
    await queryInterface.addIndex('payments', {
      fields: ['stripe_payment_intent_id'],
      unique: true,
      where: {
        stripe_payment_intent_id: {
          [Sequelize.Op.ne]: null
        }
      },
      name: 'payments_stripe_payment_intent_id_unique'
    });

    // Add index for Stripe charge ID
    await queryInterface.addIndex('payments', ['stripe_charge_id']);
    
    // Add index for Stripe refund ID
    await queryInterface.addIndex('payments', ['stripe_refund_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('payments');
  }
};
