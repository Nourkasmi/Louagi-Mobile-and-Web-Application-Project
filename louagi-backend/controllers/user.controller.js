const bcrypt = require('bcrypt');
const { User, Passenger, Driver } = require('../models');
const { validateUserUpdate } = require('../middlewares/validate.middleware');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

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
      const { role, search, is_verified } = req.query;
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
      
      // ✅ FIX: Include driver and passenger profiles for better data
      const includeClause = [
        {
          model: Passenger,
          as: 'passengerProfile',
          required: false
        },
        {
          model: Driver,
          as: 'driverProfile',
          required: false,
          // ✅ FIX: Filter by verification status if requested
          ...(is_verified !== undefined && {
            where: { is_verified: is_verified === 'true' }
          })
        }
      ];
      
      // Get users with pagination
      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        include: includeClause,
        limit,
        offset,
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']],
        distinct: true // ✅ FIX: Ensure accurate count with includes
      });
      
      console.log(`📊 Found ${count} users (page ${page}, showing ${rows.length})`);
      
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
      
      console.log(`🔍 Getting user by ID: ${userId}`);
      
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
      
      console.log(`✅ User found: ${user.username} (${user.role})`);
      
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
   * ✅ ENHANCED: Update user with proper driver verification support
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateUser: async (req, res) => {
    try {
      const userId = req.params.id;
      const body = req.body;

      console.log(`🔄 Updating user ${userId} with data:`, body);

      // ✅ FIX 1: Handle simple isActive updates (for quick status toggles)
      if (Object.keys(body).length === 1 && body.hasOwnProperty('isActive')) {
        const user = await User.findByPk(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        user.isActive = body.isActive;
        await user.save();
        
        console.log(`✅ User status updated: ${user.username} -> isActive: ${body.isActive}`);
        
        return res.status(200).json({
          success: true,
          user,
          message: `User ${body.isActive ? 'activated' : 'deactivated'} successfully`
        });
      }

      // ✅ FIX 2: Handle driver verification updates
      if (body.driverProfile && typeof body.driverProfile === 'object') {
        console.log('🔍 Processing driver profile update:', body.driverProfile);
        
        const user = await User.findByPk(userId, {
          include: [
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

        if (user.role !== 'driver') {
          return res.status(400).json({
            success: false,
            message: 'User is not a driver'
          });
        }

        // Update driver profile within transaction
        await sequelize.transaction(async (t) => {
          if (user.driverProfile) {
            // Update existing driver profile
            const updateData = {};
            
            // ✅ FIX 3: Handle verification fields properly
            if (body.driverProfile.hasOwnProperty('is_verified')) {
              updateData.is_verified = body.driverProfile.is_verified;
            }
            if (body.driverProfile.verification_notes) {
              updateData.verification_notes = body.driverProfile.verification_notes;
            }
            if (body.driverProfile.verification_date) {
              updateData.verification_date = body.driverProfile.verification_date;
            }
            
            // Handle other driver profile fields
            if (body.driverProfile.license_no) {
              updateData.license_no = body.driverProfile.license_no;
            }
            if (body.driverProfile.experience !== undefined) {
              updateData.experience = body.driverProfile.experience;
            }
            if (body.driverProfile.vehicle_type) {
              updateData.vehicle_type = body.driverProfile.vehicle_type;
            }
            if (body.driverProfile.vehicle_capacity !== undefined) {
              updateData.vehicle_capacity = body.driverProfile.vehicle_capacity;
            }
            if (body.driverProfile.license_expiry) {
              updateData.license_expiry = body.driverProfile.license_expiry;
            }

            console.log('📝 Updating driver profile with:', updateData);
            
            await user.driverProfile.update(updateData, { transaction: t });
            
            console.log(`✅ Driver profile updated for user: ${user.username}`);
          } else {
            // Create new driver profile if it doesn't exist
            console.log('📝 Creating new driver profile...');
            await Driver.create({
              user_id: userId,
              license_no: body.driverProfile.license_no || 'TBD',
              experience: body.driverProfile.experience || 0,
              vehicle_type: body.driverProfile.vehicle_type || 'Standard',
              vehicle_capacity: body.driverProfile.vehicle_capacity || 4,
              is_verified: body.driverProfile.is_verified || false,
              rating: 5.0
            }, { transaction: t });
          }
        });

        // Fetch updated user with driver profile
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
          user: updatedUser,
          message: 'Driver profile updated successfully'
        });
      }

      // ✅ FIX 4: Handle regular user updates with validation
      const { error } = validateUserUpdate(body);
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
      const { username, email, phone, password, license_no, experience, preferences, payment_info } = body;

      // Update user with transaction to ensure consistency
      await sequelize.transaction(async (t) => {
        const updateData = {};
        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (phone) updateData.phone = phone;
        if (password) updateData.password = password;

        await user.update(updateData, { transaction: t });

        // Update role-specific profiles
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
          { model: Passenger, as: 'passengerProfile', required: false },
          { model: Driver, as: 'driverProfile', required: false }
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