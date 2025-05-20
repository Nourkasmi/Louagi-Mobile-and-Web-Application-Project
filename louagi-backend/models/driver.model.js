'use strict';

module.exports = (sequelize, DataTypes) => {
  const Driver = sequelize.define(
    'Driver',
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
          model: 'users', // must match table name
          key: 'id'
        },
        field: 'user_id'
      },
      license_no: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        field: 'license_no'
      },
      license_expiry: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'license_expiry'
      },
      experience: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      rating: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 5
        }
      },
      vehicle_type: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'vehicle_type'
      },
      vehicle_capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4,
        field: 'vehicle_capacity'
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_verified'
      },
      is_available: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_available'
      },
      documents: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      }
    },
    {
      tableName: 'drivers',
      underscored: true,
      timestamps: true
    }
  );

  Driver.associate = (models) => {
    Driver.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    Driver.hasMany(models.Trip, {
      foreignKey: 'driverId',
      as: 'trips'
    });

    Driver.hasMany(models.DriverQueue, {
      foreignKey: 'driverId',
      as: 'queuePositions'
    });
  };

  return Driver;
};
