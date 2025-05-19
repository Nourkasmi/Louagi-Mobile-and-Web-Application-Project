module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50]
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          is: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
        }
      },
      role: {
        type: DataTypes.ENUM('passenger', 'driver', 'admin'),
        allowNull: false,
        defaultValue: 'passenger'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      lastLogin: {
        type: DataTypes.DATE
      },
      profileImage: {
        type: DataTypes.STRING
      }
    },
    {
      tableName: 'users',
      // Don't return the password when converting to JSON
      defaultScope: {
        attributes: { exclude: ['password'] }
      },
      // Use this scope when needing password (authentication)
      scopes: {
        withPassword: {
          attributes: { include: ['password'] }
        }
      }
    }
  );

  // Define associations
  User.associate = (models) => {
    // User can have one passenger profile
    User.hasOne(models.Passenger, {
      foreignKey: 'userId',
      as: 'passengerProfile'
    });

    // User can have one driver profile
    User.hasOne(models.Driver, {
      foreignKey: 'userId',
      as: 'driverProfile'
    });
  };

  return User;
};