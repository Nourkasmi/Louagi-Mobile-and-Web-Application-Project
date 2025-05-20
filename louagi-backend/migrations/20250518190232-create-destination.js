'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('destinations', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      start_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'stations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      end_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'stations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      distance: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      base_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      estimated_duration: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      description: {
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

    // Optional: add composite uniqueness constraint like the model does
    await queryInterface.addConstraint('destinations', {
      fields: ['start_id', 'end_id'],
      type: 'unique',
      name: 'unique_start_end_pair'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('destinations');
  }
};
