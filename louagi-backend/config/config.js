const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

// Define validation schema
const envVarsSchema = {
  // Required environment variables
  required: [
    'NODE_ENV',
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET'
  ],
  
  // Validate specific environment variables
  validate: {
    NODE_ENV: (value) => ['development', 'test', 'production'].includes(value),
    PORT: (value) => !isNaN(parseInt(value, 10)),
    DB_PORT: (value) => !isNaN(parseInt(value, 10)),
    JWT_ACCESS_EXPIRY: (value) => /^\d+(s|m|h|d)$/.test(value),
    JWT_REFRESH_EXPIRY: (value) => /^\d+(s|m|h|d)$/.test(value),
  }
};

// Validate environment configuration
const validateEnvVars = () => {
  const errors = [];

  // Check required variables
  envVarsSchema.required.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Validate specific variables
  Object.entries(envVarsSchema.validate).forEach(([varName, validatorFn]) => {
    if (process.env[varName] && !validatorFn(process.env[varName])) {
      errors.push(`Invalid value for environment variable: ${varName}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
};

// Run validation
validateEnvVars();

// Database configuration
const dbConfig = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_TEST_NAME || 'louagi_test',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};

// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET,
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '24h',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
};

// Server configuration
const serverConfig = {
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || 'v1',
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*'
};

// Logging configuration
const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  requestFormat: process.env.REQUEST_LOG_FORMAT || 'combined'
};

// Payment configuration
const paymentConfig = {
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET
};

// Email configuration (optional)
const emailConfig = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  from: process.env.EMAIL_FROM
};

module.exports = {
  db: dbConfig[process.env.NODE_ENV || 'development'],
  jwt: jwtConfig,
  server: serverConfig,
  logging: loggingConfig,
  payment: paymentConfig,
  email: emailConfig
};