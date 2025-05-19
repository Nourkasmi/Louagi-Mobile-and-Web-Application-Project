module.exports = (sequelize, DataTypes) => {
  const Trip = sequelize.define(
    'Trip',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      routeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'destinations',
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
      driverId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'drivers',
          key: 'id'
        }
      },
      queueId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'driver_queue',
          key: 'id'
        }
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4
      },
      availableSeats: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4
      },
      status: {
        type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled'
      },
      departureTime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      estimatedArrivalTime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      actualArrivalTime: {
        type: DataTypes.DATE,
        allowNull: true
      },
      basePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      currentPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'trips',
      indexes: [
        {
          fields: ['routeId', 'departureTime']
        },
        {
          fields: ['driverId', 'status']
        },
        {
          fields: ['scheduleId', 'status']
        }
      ]
    }
  );

  // Define associations
  Trip.associate = (models) => {
    // Trip belongs to one route/destination
    Trip.belongsTo(models.Destination, {
      foreignKey: 'routeId',
      as: 'route'
    });

    // Trip belongs to one schedule
    Trip.belongsTo(models.Schedule, {
      foreignKey: 'scheduleId',
      as: 'schedule'
    });

    // Trip belongs to one driver
    Trip.belongsTo(models.Driver, {
      foreignKey: 'driverId',
      as: 'driver'
    });

    // Trip belongs to one driver queue entry
    Trip.belongsTo(models.DriverQueue, {
      foreignKey: 'queueId',
      as: 'queueEntry'
    });

    // Trip can have many bookings
    Trip.hasMany(models.Booking, {
      foreignKey: 'tripId',
      as: 'bookings'
    });
  };

  return Trip;
};
