const config = require('./config');

/**
 * JWT Options Configuration
 */
const jwtOptions = {
  // JWT access token options
  accessToken: {
    secret: config.jwt.secret,
    options: {
      expiresIn: config.jwt.accessTokenExpiry,
      issuer: 'louagi-api',
      audience: 'louagi-client'
    }
  },
  
  // JWT refresh token options
  refreshToken: {
    secret: config.jwt.secret,
    options: {
      expiresIn: config.jwt.refreshTokenExpiry,
      issuer: 'louagi-api',
      audience: 'louagi-client'
    }
  }
};

module.exports = jwtOptions;
