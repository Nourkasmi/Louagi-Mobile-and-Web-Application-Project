'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('stations', [
      {
        id: uuidv4(),
        name: 'Station Bab Saadoun',
        location: JSON.stringify({ lat: 36.7949, lng: 10.1797 }),
        address: 'Avenue Bab Saadoun, Tunis',
        city: 'Tunis',
        state: 'Tunis',
        zip_code: '1006',
        capacity: 100,
        is_active: true,
        contact_phone: '+21671123456',
        contact_email: 'contact@babelfellah.tn',
        amenities: JSON.stringify({ wifi: true, toilets: true, foodCourt: true }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Station Ksar Hellal',
        location: JSON.stringify({ lat: 35.6489, lng: 10.8665 }),
        address: 'Rue de la Gare, Ksar Hellal',
        city: 'Monastir',
        state: 'Monastir',
        zip_code: '5070',
        capacity: 60,
        is_active: true,
        contact_phone: '+21673567890',
        contact_email: 'gare@ksarhellal.tn',
        amenities: JSON.stringify({ wifi: false, toilets: true }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('stations', null, {});
  }
};
