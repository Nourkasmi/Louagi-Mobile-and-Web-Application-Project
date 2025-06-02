'use strict';

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
        },
        field: 'route_id'
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
      driverId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'drivers',
          key: 'id'
        },
        field: 'driver_id'
      },
      queueId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'queues',
          key: 'id'
        },
        field: 'queue_id'
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4
      },
      availableSeats: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4,
        field: 'available_seats'
      },
      status: {
        type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled'
      },
      departureTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'departure_time'
      },
      estimatedArrivalTime: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'estimated_arrival_time'
      },
      actualArrivalTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'actual_arrival_time'
      },
      // ✅ NEW: Track when trip actually started
      actualDepartureTime: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'actual_departure_time'
      },
      basePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'base_price'
      },
      currentPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'current_price'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'trips',
      timestamps: true,
      underscored: true,
      indexes: [
        { fields: ['route_id', 'departure_time'] },
        { fields: ['driver_id', 'status'] },
        { fields: ['schedule_id', 'status'] }
      ]
    }
  );

  Trip.associate = (models) => {
    Trip.belongsTo(models.Destination, {
      foreignKey: 'routeId',
      as: 'route'
    });

    Trip.belongsTo(models.Schedule, {
      foreignKey: 'scheduleId',
      as: 'schedule'
    });

    Trip.belongsTo(models.Driver, {
      foreignKey: 'driverId',
      as: 'driver'
    });

    Trip.belongsTo(models.DriverQueue, {
      foreignKey: 'queueId',
      as: 'queueEntry'
    });

    Trip.hasMany(models.Booking, {
      foreignKey: 'tripId',
      as: 'bookings'
    });
  };

  return Trip;
};
