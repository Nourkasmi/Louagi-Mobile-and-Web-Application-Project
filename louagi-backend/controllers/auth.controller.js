const bcrypt = require('bcrypt');
const { User, Passenger, Driver } = require('../models');
const jwtService = require('../services/jwt.service');
const { validateRegistration, validateLogin } = require('../middlewares/validate.middleware');

/**
 * Authentication controller
 */
const authController = {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  register: async (req, res) => {
    try {
      // Validate request body
      const { error } = validateRegistration(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { username, email, password, phone, role = 'passenger' } = req.body;

      // Check if email already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user with transaction to ensure consistency
      const result = await sequelize.transaction(async (t) => {
        // Create user
        const user = await User.create({
          username,
          email,
          password: hashedPassword,
          phone,
          role
        }, { transaction: t });

        // Create role-specific profile
        if (role === 'passenger') {
          await Passenger.create({
            user_id: user.id,
            preferences: req.body.preferences || {},
            payment_info: req.body.payment_info || {}
          }, { transaction: t });
        } else if (role === 'driver') {
          await Driver.create({
            user_id: user.id,
            license_no: req.body.license_no,
            experience: req.body.experience || 0,
            rating: 5.0 // Default rating
          }, { transaction: t });
        }

        return user;
      });

      // Generate JWT token
      const token = jwtService.generateToken(result);

      // Return user data (excluding password) and token
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
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login: async (req, res) => {
    try {
      // Validate request body
      const { error } = validateLogin(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }

      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Compare passwords
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = jwtService.generateToken(user);

      // Return user data (excluding password) and token
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
   * Get current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCurrentUser: async (req, res) => {
    try {
      // User is attached to request by auth middleware
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Remove password from response
      const userData = user.toJSON();
      delete userData.password;

      return res.status(200).json({
        success: true,
        user: userData
      });
    } catch (error) {
      console.error('Get current user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get user information'
      });
    }
  },

  /**
   * Logout user (client-side token deletion)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  logout: (req, res) => {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  }
};

module.exports = authController;
