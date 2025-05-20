'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('trips', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      route_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'destinations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      schedule_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'schedules',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      driver_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'drivers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      queue_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'queues', // ✅ FIXED: it was incorrectly pointing to driver_queue
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 4
      },
      available_seats: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 4
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled'
      },
      departure_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      estimated_arrival_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      actual_arrival_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      base_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      current_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      notes: {
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

    await queryInterface.addIndex('trips', ['route_id', 'departure_time']);
    await queryInterface.addIndex('trips', ['driver_id', 'status']);
    await queryInterface.addIndex('trips', ['schedule_id', 'status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('trips');
  }
};
