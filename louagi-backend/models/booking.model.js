module.exports = (sequelize, DataTypes) => {
  const Booking = sequelize.define(
    'Booking',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      tripId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'trip_id',
        references: {
          model: 'trips',
          key: 'id'
        }
      },
      passengerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'passenger_id',
        references: {
          model: 'passengers',
          key: 'id'
        }
      },
      seats: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1
        }
      },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show'),
        allowNull: false,
        defaultValue: 'pending'
      },
      paymentId: {
        type: DataTypes.STRING,
        field: 'payment_id',
        allowNull: true
      },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending',
        field: 'payment_status'
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      bookingReference: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'booking_reference'
      },
      bookedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'booked_at'
      },
      cancellationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'cancellation_reason'
      },
      specialRequests: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'special_requests'
      }
    },
    {
      tableName: 'bookings',
      underscored: true, // Optional: use if your DB uses snake_case for all fields
      indexes: [
        { fields: ['trip_id', 'status'] },
        { fields: ['passenger_id', 'status'] },
        { fields: ['booking_reference'] }
      ]
    }
  );

  Booking.associate = (models) => {
    Booking.belongsTo(models.Trip, {
      foreignKey: 'tripId',
      as: 'trip'
    });

    Booking.belongsTo(models.Passenger, {
      foreignKey: 'passengerId',
      as: 'passenger'
    });
  };

  Booking.addHook('beforeCreate', async (booking) => {
    const prefix = 'LG';
    const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
    booking.bookingReference = `${prefix}-${randomDigits}`;
  });

  return Booking;
};
