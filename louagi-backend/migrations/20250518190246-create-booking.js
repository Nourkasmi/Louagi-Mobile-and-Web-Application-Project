'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      trip_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'trips',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      passenger_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'passengers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      seats: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'),
        allowNull: false,
        defaultValue: 'pending'
      },
      payment_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      payment_status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      booking_reference: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      booked_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      cancellation_reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      special_requests: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.addIndex('bookings', ['trip_id', 'status']);
    await queryInterface.addIndex('bookings', ['passenger_id', 'status']);
    await queryInterface.addIndex('bookings', ['booking_reference']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('bookings');
  }
};
