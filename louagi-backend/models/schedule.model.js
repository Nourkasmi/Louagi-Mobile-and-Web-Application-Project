'use strict';

module.exports = (sequelize, DataTypes) => {
  const Schedule = sequelize.define(
    'Schedule',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      stationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'stations',
          key: 'id'
        },
        field: 'station_id'
      },
      dayOfWeek: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 7
        },
        field: 'day_of_week'
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'start_time'
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
        field: 'end_time'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
      },
      maxTrips: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        field: 'max_trips'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'schedules',
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['station_id', 'day_of_week', 'start_time']
        }
      ]
    }
  );

  Schedule.associate = (models) => {
    Schedule.belongsTo(models.Station, {
      foreignKey: 'stationId',
      as: 'station'
    });

    Schedule.hasMany(models.Trip, {
      foreignKey: 'scheduleId',
      as: 'trips'
    });

    Schedule.hasMany(models.DriverQueue, {
      foreignKey: 'scheduleId',
      as: 'driverQueues'
    });
  };

  return Schedule;
};
