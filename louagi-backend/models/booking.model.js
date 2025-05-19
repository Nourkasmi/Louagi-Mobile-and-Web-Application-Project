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
        references: {
          model: 'trips',
          key: 'id'
        }
      },
      passengerId: {
        type: DataTypes.UUID,
        allowNull: false,
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
        allowNull: true
      },
      paymentStatus: {
        type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      bookingReference: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      bookedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      cancellationReason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      specialRequests: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'bookings',
      indexes: [
        {
          fields: ['tripId', 'status']
        },
        {
          fields: ['passengerId', 'status']
        },
        {
          fields: ['bookingReference']
        }
      ]
    }
  );

  // Define associations
  Booking.associate = (models) => {
    // Booking belongs to one trip
    Booking.belongsTo(models.Trip, {
      foreignKey: 'tripId',
      as: 'trip'
    });

    // Booking belongs to one passenger
    Booking.belongsTo(models.Passenger, {
      foreignKey: 'passengerId',
      as: 'passenger'
    });
  };

  // Hooks
  Booking.addHook('beforeCreate', async (booking) => {
    // Generate a unique booking reference (e.g., LG-1234567)
    const prefix = 'LG';
    const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
    booking.bookingReference = `${prefix}-${randomDigits}`;
  });

  return Booking;
};