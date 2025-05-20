'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [stations] = await queryInterface.sequelize.query(
      `SELECT id, name FROM "stations";`
    );

    const startStation = stations.find(station => station.name === 'Station Bab Saadoun');
    const endStation = stations.find(station => station.name === 'Station Ksar Hellal');

    if (!startStation || !endStation) {
      throw new Error('Required stations not found.');
    }

    const now = new Date();
    await queryInterface.bulkInsert('destinations', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        start_id: startStation.id,
        end_id: endStation.id,
        distance: 160.5,
        base_price: 18.75,
        created_at: now,
        estimated_duration: 120,
        updated_at: now
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('destinations', null, {});
  }
};
