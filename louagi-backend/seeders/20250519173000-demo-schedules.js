'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [stations] = await queryInterface.sequelize.query(
      `SELECT id, name FROM "stations";`
    );

    const station = stations.find(st => st.name === 'Station Bab Saadoun');
    if (!station) {
      throw new Error('Station Bab Saadoun not found');
    }

    const now = new Date();
    await queryInterface.bulkInsert('schedules', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        station_id: station.id,
        day_of_week: 1,
        start_time: '08:00',
        end_time: '18:00',
        is_active: true,
        created_at: now,
        updated_at: now
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        station_id: station.id,
        day_of_week: 2,
        start_time: '08:00',
        end_time: '18:00',
        is_active: true,
        created_at: now,
        updated_at: now
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('schedules', null, {});
  }
};
