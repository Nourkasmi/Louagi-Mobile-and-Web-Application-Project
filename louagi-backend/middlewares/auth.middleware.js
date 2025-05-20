const jwtService = require('../services/jwt.service');
const { User } = require('../models');

/**
 * Authentication middleware
 */
const authMiddleware = {
  /**
   * Verify JWT token and attach user to request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  authenticate: async (req, res, next) => {
    try {
      // Extract token from headers
      const token = jwtService.extractToken(req);
      
      if (!token) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      // Verify token
      const decoded = jwtService.verifyToken(token);
      
      // Get user from database
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
  },
  
  /**
   * Check if user has required role
   * @param {String|Array} roles - Required role(s)
   * @returns {Function} Middleware function
   */
  hasRole: (roles) => {
    return (req, res, next) => {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      // Convert roles to array if string
      const requiredRoles = Array.isArray(roles) ? roles : [roles];
      
      // Check if user has required role
      if (!requiredRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Permission denied' 
        });
      }
      
      next();
    };
  },
  
  /**
   * Check if user owns the resource or is admin
   * @param {Function} getResourceUserId - Function to extract owner ID from request
   * @returns {Function} Middleware function
   */
  isOwnerOrAdmin: (getResourceUserId) => {
    return async (req, res, next) => {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
      }
      
      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Get resource owner ID
      const resourceUserId = await getResourceUserId(req);
      
      // Check if user is owner
      if (req.user.id !== resourceUserId) {
        return res.status(403).json({ 
          success: false, 
          message: 'Permission denied' 
        });
      }
      
      next();
    };
  }
};

module.exports = authMiddleware;
