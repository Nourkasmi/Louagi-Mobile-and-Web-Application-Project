// migrations/20240628_add_rollover_processed_to_schedule.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('schedules', 'rollover_processed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'rollover_processed'
    });
  },
  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('schedules', 'rollover_processed');
  }
}; 