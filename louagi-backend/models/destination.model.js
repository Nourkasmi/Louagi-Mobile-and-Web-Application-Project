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
        field: 'start_id',
        references: {
          model: 'stations',
          key: 'id'
        }
      },
      endId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'end_id',
        references: {
          model: 'stations',
          key: 'id'
        }
      },
      distance: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      basePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: 'base_price'
      },
      estimatedDuration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'estimated_duration'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
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
          fields: ['start_id', 'end_id']
        }
      ],
      timestamps: true,
      underscored: true
    }
  );

  Destination.associate = (models) => {
    Destination.belongsTo(models.Station, {
      foreignKey: 'startId',
      as: 'startStation'
    });

    Destination.belongsTo(models.Station, {
      foreignKey: 'endId',
      as: 'endStation'
    });

    Destination.hasMany(models.Trip, {
      foreignKey: 'routeId',
      as: 'trips'
    });
  };

  return Destination;
};
