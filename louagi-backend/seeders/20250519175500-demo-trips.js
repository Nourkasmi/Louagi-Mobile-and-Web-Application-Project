'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get IDs dynamically
    const [routes] = await queryInterface.sequelize.query(
      `SELECT id FROM destinations LIMIT 1;`
    );
    const [schedules] = await queryInterface.sequelize.query(
      `SELECT id FROM schedules LIMIT 1;`
    );
    const [drivers] = await queryInterface.sequelize.query(
      `SELECT id FROM drivers LIMIT 1;`
    );

    return queryInterface.bulkInsert('trips', [
      {
        id: require('uuid').v4(),
        route_id: routes[0].id,
        schedule_id: schedules[0].id,
        driver_id: drivers[0].id,
        capacity: 4,
        status: 'scheduled',
        departure_time: new Date('2025-06-01T08:00:00Z'),
        estimated_arrival_time: new Date('2025-06-01T10:00:00Z'),
        base_price: 20.00,
        current_price: 20.00,
        created_at: new Date(),
        available_seats: 4,
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('trips', null, {});
  }
};
