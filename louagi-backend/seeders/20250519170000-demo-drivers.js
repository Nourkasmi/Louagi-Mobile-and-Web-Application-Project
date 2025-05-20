'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fetch the driver user
    const [user] = await queryInterface.sequelize.query(
      `SELECT id FROM "users" WHERE email = 'driver@example.com' LIMIT 1;`
    );

    if (!user[0]) throw new Error('driver@example.com not found');

    await queryInterface.bulkInsert('drivers', [
      {
        id: uuidv4(),
        user_id: user[0].id,
        license_no: 'DRV-123456',
        license_expiry: '2026-12-31',
        experience: 5,
        rating: 4.7,
        vehicle_type: 'Minibus',
        vehicle_capacity: 8,
        is_verified: true,
        is_available: true,
        documents: JSON.stringify({
          insurance: 'valid',
          inspection: '2025-10-10'
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('drivers', { license_no: 'DRV-123456' });
  }
};
