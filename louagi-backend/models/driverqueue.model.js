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
        }
      },
      driverId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'drivers',
          key: 'id'
        }
      },
      scheduleId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'schedules',
          key: 'id'
        }
      },
      position: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('waiting', 'assigned', 'departed', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'waiting'
      },
      joinedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      estimatedDepartureTime: {
        type: DataTypes.DATE,
        allowNull: true
      },
      actualDepartureTime: {
        type: DataTypes.DATE,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'driver_queue',
      indexes: [
        {
          fields: ['stationId', 'status']
        },
        {
          fields: ['driverId', 'status']
        },
        {
          fields: ['scheduleId', 'position']
        }
      ]
    }
  );

  // Define associations
  DriverQueue.associate = (models) => {
    // DriverQueue belongs to one station
    DriverQueue.belongsTo(models.Station, {
      foreignKey: 'stationId',
      as: 'station'
    });

    // DriverQueue belongs to one driver
    DriverQueue.belongsTo(models.Driver, {
      foreignKey: 'driverId',
      as: 'driver'
    });

    // DriverQueue belongs to one schedule
    DriverQueue.belongsTo(models.Schedule, {
      foreignKey: 'scheduleId',
      as: 'schedule'
    });

    // DriverQueue can be associated with one trip
    DriverQueue.hasOne(models.Trip, {
      foreignKey: 'queueId',
      as: 'trip'
    });
  };

  return DriverQueue;
};