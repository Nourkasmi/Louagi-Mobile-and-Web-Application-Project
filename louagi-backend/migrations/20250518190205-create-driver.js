'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('drivers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users', // lowercase matches table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      license_no: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      license_expiry: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      experience: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      rating: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      vehicle_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      vehicle_capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 4
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: {}
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('drivers');
  }
};
