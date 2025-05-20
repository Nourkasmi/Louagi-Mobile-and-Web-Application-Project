'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('queues', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      station_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'stations',
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
      position: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('waiting', 'called', 'skipped', 'done'),
        allowNull: false,
        defaultValue: 'waiting'
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

    await queryInterface.addIndex('queues', ['station_id', 'schedule_id', 'status']);
    await queryInterface.addIndex('queues', ['driver_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('queues');
  }
};
