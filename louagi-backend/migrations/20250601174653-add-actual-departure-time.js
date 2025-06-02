'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('trips', 'actual_departure_time', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Actual time when trip started (for auto-start tracking)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('trips', 'actual_departure_time');
  }
};
