'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Driver extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Driver.init({
    user_id: DataTypes.INTEGER,
    license_no: DataTypes.STRING,
    experience: DataTypes.INTEGER,
    rating: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'Driver',
  });
  return Driver;
};