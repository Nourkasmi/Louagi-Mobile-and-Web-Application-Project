const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config/config');
const { logger } = require('../utils/logger');

// Create Sequelize instance
const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: config.db.logging ? (msg) => logger.debug(msg) : false,
    pool: config.db.pool,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true // Soft deletes
    }
  }
);

// Initialize db object
const db = {};

// Load all model files
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file.slice(-9) === '.model.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

// Set up associations between models
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Add Sequelize and sequelize instance to db object
db.Sequelize = Sequelize;
db.sequelize = sequelize;

module.exports = db;