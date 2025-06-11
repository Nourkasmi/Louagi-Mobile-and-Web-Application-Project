const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { requestLogger, logger } = require('./utils/logger');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const tripRoutes = require('./routes/trip.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const stationRoutes = require('./routes/station.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const destinationRoutes = require('./routes/destination.routes');
const driverRoutes = require('./routes/driver.routes');
const queueRoutes = require('./routes/queue.routes');

// Create Express app
const app = express();

// Use request logger
requestLogger(app);

// Apply security and compression middleware
app.use(helmet());
app.use(compression());

// ✅ Robust CORS handling for web + Expo mobile tunnels
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:8080',
  'http://localhost:19006',
  'https://*.exp.direct',
  ...config.server.corsOrigin
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin) || origin?.endsWith('.exp.direct')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// ✅ Stripe webhooks must use raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Standard body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API prefix
const apiPrefix = `/api/${config.server.apiVersion}`;

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/queues', queueRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    environment: config.server.env,
    services: {
      database: 'UP',
      stripe: config.payment.stripeSecretKey ? 'CONFIGURED' : 'NOT_CONFIGURED'
    }
  });
});

// 404 handler
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`${status} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  const response = {
    error: {
      message,
      status,
      timestamp: new Date().toISOString()
    }
  };

  if (config.server.env === 'development' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(status).json(response);
});

module.exports = app;
