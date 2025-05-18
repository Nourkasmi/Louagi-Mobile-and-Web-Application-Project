'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Schedule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Schedule.init({
    station_id: DataTypes.INTEGER,
    day_of_week: DataTypes.STRING,
    start_time: DataTypes.STRING,
    end_time: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Schedule',
  });
  return Schedule;
};