'use strict';

module.exports = (sequelize, DataTypes) => {
  const DriverQueue = sequelize.define(
    'DriverQueue',
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
      driverId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'drivers',
          key: 'id'
        },
        field: 'driver_id'
      },
      scheduleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'schedules',
          key: 'id'
        },
        field: 'schedule_id'
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('waiting', 'called', 'skipped', 'done'),
        allowNull: false,
        defaultValue: 'waiting'
      }
    },
    {
      tableName: 'queues', // ✅ must match your migration table name
      timestamps: true,
      underscored: true
    }
  );

  DriverQueue.associate = (models) => {
    DriverQueue.belongsTo(models.Station, {
      foreignKey: 'stationId',
      as: 'station'
    });

    DriverQueue.belongsTo(models.Driver, {
      foreignKey: 'driverId',
      as: 'driver'
    });

    DriverQueue.belongsTo(models.Schedule, {
      foreignKey: 'scheduleId',
      as: 'schedule'
    });

    DriverQueue.hasOne(models.Trip, {
      foreignKey: 'queueId',
      as: 'trip'
    });
  };

  return DriverQueue;
};
