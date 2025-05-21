const config = require('./config');

const jwtOptions = {
  accessToken: {
    secret: config.jwt.secret || 'default_secret',
    options: {
      expiresIn: config.jwt.accessTokenExpiry || '1d',
      issuer: 'louagi-api',
      audience: 'louagi-client'
    }
  },
  
  refreshToken: {
    secret: config.jwt.secret || 'default_secret',
    options: {
      expiresIn: config.jwt.refreshTokenExpiry || '7d',
      issuer: 'louagi-api',
      audience: 'louagi-client'
    }
  }
};

module.exports = jwtOptions;
