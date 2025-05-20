'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM "users" WHERE email = 'passenger@example.com' LIMIT 1;`
    );

    if (!users.length) {
      throw new Error('Passenger user not found. Make sure the users seeder ran first.');
    }

    const passengeruser_id = users[0].id;

    return queryInterface.bulkInsert('passengers', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        user_id: passengeruser_id,
        preferences: JSON.stringify({ preferredSeat: 'window', language: 'fr' }),
        payment_info: JSON.stringify({ stripeCustomerId: 'cus_1234567890' }),
        stripe_customer_id: 'cus_1234567890',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('passengers', null, {});
  }
};
