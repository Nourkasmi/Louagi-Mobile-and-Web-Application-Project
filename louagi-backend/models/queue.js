'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Queue extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Queue.init({
    station_id: DataTypes.INTEGER,
    driver_id: DataTypes.INTEGER,
    schedule_id: DataTypes.INTEGER,
    position: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Queue',
  });
  return Queue;
};