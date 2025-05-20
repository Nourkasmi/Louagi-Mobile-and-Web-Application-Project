'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const [trips] = await queryInterface.sequelize.query(
      `SELECT id FROM trips LIMIT 1;`
    );

    const [passengers] = await queryInterface.sequelize.query(
      `SELECT id FROM passengers LIMIT 1;`
    );

    return queryInterface.bulkInsert('bookings', [
      {
        id: require('uuid').v4(),
        booking_reference: 'LG-1234567',
        trip_id: trips[0].id,
        passenger_id: passengers[0].id,
        seats: 1,
        status: 'confirmed',
        payment_id: 'mock-payment-123',
        created_at: new Date(),
        amount: 25.00,
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('bookings', null, {});
  }
};
