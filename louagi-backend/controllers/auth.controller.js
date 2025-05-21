const bcrypt = require('bcrypt');
const { User, Passenger, Driver } = require('../models');
const jwtService = require('../services/jwt.service');
const { validateRegistration, validateLogin } = require('../middlewares/validate.middleware');
const { sequelize } = require('../models');

const authController = {
  /**
   * Register a new user
   */
  register: async (req, res) => {
    try {
      const { error } = validateRegistration(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const {
        username,
        email,
        password,
        phone,
        role = 'passenger',
        preferences,
        payment_info,
        license_no,
        experience,
        license_expiry
      } = req.body;

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }

      const result = await sequelize.transaction(async (t) => {
        const user = await User.create({
          username,
          email,
          password,
          phone,
          role
        }, { transaction: t });

        if (role === 'passenger') {
          await Passenger.create({
            user_id: user.id,
            preferences: preferences || {},
            payment_info: payment_info || {}
          }, { transaction: t });
        } else if (role === 'driver') {
          await Driver.create({
            user_id: user.id,
            license_no,
            experience: experience || 0,
            license_expiry,
            rating: 5.0
          }, { transaction: t });
        }

        return user;
      });

      const token = jwtService.generateToken(result);
      const userData = result.toJSON();
      delete userData.password;

      return res.status(201).json({
        success: true,
        token,
        user: userData
      });

    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to register user'
      });
    }
  },

  /**
   * Login user
   */
  login: async (req, res) => {
    try {
      const { error } = validateLogin(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { email, password } = req.body;

      // Get user including password field
      const user = await User.scope('withPassword').findOne({ where: { email } });

      if (!user || !user.password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const token = jwtService.generateToken(user);
      const userData = user.toJSON();
      delete userData.password;

      return res.status(200).json({
        success: true,
        token,
        user: userData
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to login'
      });
    }
  },

  /**
   * Logout user
   */
  logout: (_req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  },

  /**
   * Get current user
   */
  getCurrentUser: async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const userData = user.toJSON ? user.toJSON() : user;
      delete userData.password;

      return res.status(200).json({
        success: true,
        user: userData
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get current user'
      });
    }
  }
};

module.exports = authController;
