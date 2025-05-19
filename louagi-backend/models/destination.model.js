module.exports = (sequelize, DataTypes) => {
  const Destination = sequelize.define(
    'Destination',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      startId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'stations',
          key: 'id'
        }
      },
      endId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'stations',
          key: 'id'
        }
      },
      distance: {
        type: DataTypes.FLOAT, // in kilometers
        allowNull: false
      },
      basePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      estimatedDuration: {
        type: DataTypes.INTEGER, // in minutes
        allowNull: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'destinations',
      indexes: [
        {
          unique: true,
          fields: ['startId', 'endId']
        }
      ]
    }
  );

  // Define associations
  Destination.associate = (models) => {
    // Destination belongs to start station
    Destination.belongsTo(models.Station, {
      foreignKey: 'startId',
      as: 'startStation'
    });

    // Destination belongs to end station
    Destination.belongsTo(models.Station, {
      foreignKey: 'endId',
      as: 'endStation'
    });

    // Destination can have many trips
    Destination.hasMany(models.Trip, {
      foreignKey: 'routeId',
      as: 'trips'
    });
  };

  return Destination;
};