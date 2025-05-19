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
        }
      },
      dayOfWeek: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0, // Sunday
          max: 6  // Saturday
        }
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      maxTrips: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'schedules',
      indexes: [
        {
          unique: true,
          fields: ['stationId', 'dayOfWeek', 'startTime']
        }
      ]
    }
  );

  // Define associations
  Schedule.associate = (models) => {
    // Schedule belongs to one station
    Schedule.belongsTo(models.Station, {
      foreignKey: 'stationId',
      as: 'station'
    });

    // Schedule can have many trips
    Schedule.hasMany(models.Trip, {
      foreignKey: 'scheduleId',
      as: 'trips'
    });

    // Schedule can have many driver queue entries
    Schedule.hasMany(models.DriverQueue, {
      foreignKey: 'scheduleId',
      as: 'driverQueues'
    });
  };

  return Schedule;
};