const bcrypt = require('bcrypt');
const { User, Passenger, Driver } = require('../models');
const { validateUserUpdate } = require('../middlewares/validate.middleware');
const { sequelize } = require('../models');
const { Op } = require('sequelize'); // <-- ADD THIS LINE

/**
 * User management controller
 */
const userController = {
  /**
   * Get all users (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllUsers: async (req, res) => {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
      
      // Filtering parameters
      const { role, search } = req.query;
      const whereClause = {};
      
      if (role) {
        whereClause.role = role;
      }
      
      if (search) {
        whereClause[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      // Get users with pagination
      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']]
      });
      
      return res.status(200).json({
        success: true,
        users: rows,
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve users'
      });
    }
  },
  
  /**
   * Get user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserById: async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Get user by ID
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Passenger,
            as: 'passengerProfile',
            required: false
          },
          {
            model: Driver,
            as: 'driverProfile',
            required: false
          }
        ]
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get user by ID error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user'
      });
    }
  },
  
  /**
   * Update user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateUser: async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Validate request body
      const { error } = validateUserUpdate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details[0].message
        });
      }
      
      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Extract updatable fields
      const { 
        username, email, phone, password,
        license_no, experience,
        preferences, payment_info
      } = req.body;
      
      // Update user with transaction to ensure consistency
      await sequelize.transaction(async (t) => {
        // Update user fields
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        
        // Hash password if provided
        if (password) {
          updateData.password = password;  // Store the plain password
}
        
        // Update user
        await user.update(updateData, { transaction: t });
        
        // Update role-specific information
        if (user.role === 'driver' && (license_no || experience !== undefined)) {
          const driver = await Driver.findOne({ where: { user_id: userId } });
          if (driver) {
            const driverUpdateData = {};
            if (license_no) driverUpdateData.license_no = license_no;
            if (experience !== undefined) driverUpdateData.experience = experience;
            
            await driver.update(driverUpdateData, { transaction: t });
          }
        }
        
        if (user.role === 'passenger' && (preferences || payment_info)) {
          const passenger = await Passenger.findOne({ where: { user_id: userId } });
          if (passenger) {
            const passengerUpdateData = {};
            if (preferences) passengerUpdateData.preferences = preferences;
            if (payment_info) passengerUpdateData.payment_info = payment_info;
            
            await passenger.update(passengerUpdateData, { transaction: t });
          }
        }
      });
      
      // Get updated user
      const updatedUser = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [
          {
            model: Passenger,
            as: 'passengerProfile',
            required: false
          },
          {
            model: Driver,
            as: 'driverProfile',
            required: false
          }
        ]
      });
      
      return res.status(200).json({
        success: true,
        user: updatedUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  },
  
  /**
   * Delete user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteUser: async (req, res) => {
    try {
      const userId = req.params.id;
      
      // Check if user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Delete user with transaction to ensure consistency
      await sequelize.transaction(async (t) => {
        // Delete role-specific data first
        if (user.role === 'driver') {
          await Driver.destroy({ where: { user_id: userId }, transaction: t });
        } else if (user.role === 'passenger') {
          await Passenger.destroy({ where: { user_id: userId }, transaction: t });
        }
        
        // Delete user
        await user.destroy({ transaction: t });
      });
      
      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }
};

module.exports = userController;