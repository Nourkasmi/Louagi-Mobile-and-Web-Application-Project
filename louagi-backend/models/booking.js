'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Booking.init({
    trip_id: DataTypes.INTEGER,
    passenger_id: DataTypes.INTEGER,
    seats: DataTypes.INTEGER,
    status: DataTypes.STRING,
    payment_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};