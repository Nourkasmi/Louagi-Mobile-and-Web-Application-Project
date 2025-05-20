'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const password = await bcrypt.hash('password123', 10);

    await queryInterface.bulkInsert('users', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        username: 'adminUser',
        email: 'admin@example.com',
        password,
        phone: '+21699999999',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        username: 'driverUser',
        email: 'driver@example.com',
        password,
        phone: '+21688888888',
        role: 'driver',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        username: 'passengerUser',
        email: 'passenger@example.com',
        password,
        phone: '+21677777777',
        role: 'passenger',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
