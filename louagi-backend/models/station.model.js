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
      location: {
        type: DataTypes.GEOMETRY('POINT'),
        allowNull: false
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
        allowNull: false
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 50
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      contactPhone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      amenities: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      }
    },
    {
      tableName: 'stations'
    }
  );

  // Define associations
  Station.associate = (models) => {
    // Station can have many schedules
    Station.hasMany(models.Schedule, {
      foreignKey: 'stationId',
      as: 'schedules'
    });

    // Station can have many driver queues
    Station.hasMany(models.DriverQueue, {
      foreignKey: 'stationId',
      as: 'driverQueues'
    });

    // Station can be a start or end point for many destinations
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