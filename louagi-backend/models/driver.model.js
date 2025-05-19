module.exports = (sequelize, DataTypes) => {
  const Driver = sequelize.define(
    'Driver',
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
      licenseNo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      licenseExpiry: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      experience: {
        type: DataTypes.INTEGER, // in years
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
      vehicleType: {
        type: DataTypes.STRING,
        allowNull: true
      },
      vehicleCapacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      documents: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      }
    },
    {
      tableName: 'drivers'
    }
  );

  // Define associations
  Driver.associate = (models) => {
    // Driver belongs to one User
    Driver.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Driver can have many trips
    Driver.hasMany(models.Trip, {
      foreignKey: 'driverId',
      as: 'trips'
    });

    // Driver can be in many queue positions
    Driver.hasMany(models.DriverQueue, {
      foreignKey: 'driverId',
      as: 'queuePositions'
    });
  };

  return Driver;
};