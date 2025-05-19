module.exports = (sequelize, DataTypes) => {
  const Passenger = sequelize.define(
    'Passenger',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      preferences: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      paymentInfo: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: 'passengers'
    }
  );

  // Define associations
  Passenger.associate = (models) => {
    // Passenger belongs to one User
    Passenger.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Passenger can have many bookings
    Passenger.hasMany(models.Booking, {
      foreignKey: 'passengerId',
      as: 'bookings'
    });
  };

  return Passenger;
};
