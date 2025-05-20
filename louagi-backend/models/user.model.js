'use strict';

const bcrypt = require('bcrypt');

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
        defaultValue: true,
        field: 'is_active'
      },
      lastLogin: {
        type: DataTypes.DATE,
        field: 'last_login'
      },
      profileImage: {
        type: DataTypes.STRING,
        field: 'profile_image'
      }
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ['password'] }
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] }
        }
      }
    }
  );

  User.associate = (models) => {
    User.hasOne(models.Passenger, {
      foreignKey: 'user_id',
      as: 'passengerProfile'
    });

    User.hasOne(models.Driver, {
      foreignKey: 'user_id',
      as: 'driverProfile'
    });
  };

  User.addHook('beforeCreate', async (user) => {
    if (user.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  });

  User.addHook('beforeUpdate', async (user) => {
    if (user.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  });

  return User;
};
