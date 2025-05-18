'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Passenger extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Passenger.init({
    user_id: DataTypes.INTEGER,
    preferences: DataTypes.STRING,
    payment_info: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Passenger',
  });
  return Passenger;
};