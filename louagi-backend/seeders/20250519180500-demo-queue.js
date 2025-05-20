'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const [stations] = await queryInterface.sequelize.query(
      `SELECT id FROM stations LIMIT 1;`
    );

    const [drivers] = await queryInterface.sequelize.query(
      `SELECT id FROM drivers LIMIT 1;`
    );

    const [schedules] = await queryInterface.sequelize.query(
      `SELECT id FROM schedules LIMIT 1;`
    );

    return queryInterface.bulkInsert('queues', [
      {
        id: require('uuid').v4(),
        station_id: stations[0].id,
        driver_id: drivers[0].id,
        schedule_id: schedules[0].id,
        position: 1,
        status: 'waiting',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('queues', null, {});
  }
};
