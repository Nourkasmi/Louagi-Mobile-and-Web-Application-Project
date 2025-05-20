'use strict';

module.exports = (sequelize, DataTypes) => {
  const Station = sequelize.define(
    'Station',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false
      },
      city: {
        type: DataTypes.STRING,
        allowNull: false
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false
      },
      zipCode: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'zip_code'
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active'
      },
      contactPhone: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'contact_phone'
      },
      contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true
        },
        field: 'contact_email'
      },
      amenities: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      }
    },
    {
      tableName: 'stations',
      timestamps: true,
      underscored: true
    }
  );

  Station.associate = (models) => {
    Station.hasMany(models.Schedule, {
      foreignKey: 'stationId',
      as: 'schedules'
    });

    Station.hasMany(models.queues, {
      foreignKey: 'stationId',
      as: 'driverQueues'
    });

    Station.hasMany(models.Destination, {
      foreignKey: 'startId',
      as: 'startPoints'
    });

    Station.hasMany(models.Destination, {
      foreignKey: 'endId',
      as: 'endPoints'
    });
  };

  return Station;
};
