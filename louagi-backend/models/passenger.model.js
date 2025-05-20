'use strict';

module.exports = (sequelize, DataTypes) => {
  const Passenger = sequelize.define(
    'Passenger',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        field: 'user_id'
      },
      preferences: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      paymentInfo: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {},
        field: 'payment_info'
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'stripe_customer_id'
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified'
      }
    },
    {
      tableName: 'passengers',
      underscored: true,
      timestamps: true
    }
  );

  Passenger.associate = (models) => {
    Passenger.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    Passenger.hasMany(models.Booking, {
      foreignKey: 'passengerId',
      as: 'bookings'
    });
  };

  return Passenger;
};
