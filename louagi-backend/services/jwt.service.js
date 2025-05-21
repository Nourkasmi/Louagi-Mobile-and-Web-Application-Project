const jwt = require('jsonwebtoken');
const jwtOptions = require('../config/jwt');

/**
 * JWT Service for token generation and verification
 */
class JwtService {
  /**
   * Generate a JWT token for a user
   * @param {Object} user - User object containing id, email, and role
   * @returns {String} JWT token
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    return jwt.sign(payload, jwtOptions.accessToken.secret, jwtOptions.accessToken.options);
  }

  /**
   * Verify a JWT token and return decoded payload
   * @param {String} token - JWT token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, jwtOptions.accessToken.secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Extract token from request headers
   * @param {Object} req - Express request object
   * @returns {String|null} Extracted token or null
   */
  extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    
    return null;
  }
}

module.exports = new JwtService();
