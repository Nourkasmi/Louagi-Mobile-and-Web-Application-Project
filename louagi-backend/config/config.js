const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

// Active environment
const env = process.env.NODE_ENV || 'development';

// Validation schema
const envVarsSchema = {
  required: [
    'NODE_ENV', 
    'PORT', 
    'DB_HOST', 
    'DB_PORT', 
    'DB_NAME', 
    'DB_USER', 
    'DB_PASSWORD', 
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ],
  validate: {
    NODE_ENV: (v) => ['development', 'test', 'production'].includes(v),
    PORT: (v) => !isNaN(parseInt(v, 10)),
    DB_PORT: (v) => !isNaN(parseInt(v, 10)),
    JWT_ACCESS_EXPIRY: (v) => !v || /^\d+(s|m|h|d)$/.test(v),
    JWT_REFRESH_EXPIRY: (v) => !v || /^\d+(s|m|h|d)$/.test(v),
    STRIPE_SECRET_KEY: (v) => v && (v.startsWith('sk_test_') || v.startsWith('sk_live_')),
    STRIPE_WEBHOOK_SECRET: (v) => v && v.startsWith('whsec_')
  }
};

const validateEnvVars = () => {
  const errors = [];
  envVarsSchema.required.forEach(key => {
    if (!process.env[key]) errors.push(`Missing env var: ${key}`);
  });
  Object.entries(envVarsSchema.validate).forEach(([key, fn]) => {
    if (process.env[key] && !fn(process.env[key])) {
      errors.push(`Invalid env var: ${key}`);
    }
  });
  if (errors.length) throw new Error(`Env validation failed:\n${errors.join('\n')}`);
};

validateEnvVars();

const dbEnvs = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: 'postgres',
    logging: console.log,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_TEST_NAME || 'louagi_test',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: 'postgres',
    logging: false,
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    dialect: 'postgres',
    logging: false,
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 }
  }
};

const fullConfig = {
  db: dbEnvs[env],
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '24h',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  server: {
    env,
    port: parseInt(process.env.PORT, 10),
    apiVersion: process.env.API_VERSION || 'v1',
    corsOrigin: (process.env.CORS_ORIGIN || '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean)
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    requestFormat: process.env.REQUEST_LOG_FORMAT || 'combined'
  },
  payment: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    currency: process.env.DEFAULT_CURRENCY || 'usd',
    processingFeePercentage: parseFloat(process.env.PROCESSING_FEE_PERCENTAGE) || 2.9,
    processingFeeFixed: parseFloat(process.env.PROCESSING_FEE_FIXED) || 0.30,
    refundProcessingDays: parseInt(process.env.REFUND_PROCESSING_DAYS) || 5,
    paymentIntentConfirmationMethod: process.env.PAYMENT_INTENT_CONFIRMATION_METHOD || 'automatic',
    paymentIntentCaptureMethod: process.env.PAYMENT_INTENT_CAPTURE_METHOD || 'automatic'
  },
  email: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    from: process.env.EMAIL_FROM
  }
};

module.exports = require.main?.filename.includes('sequelize') ? dbEnvs : fullConfig;
