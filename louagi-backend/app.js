const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { requestLogger, logger } = require('./utils/logger');
const config = require('./config/config');

// Routes
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

const app = express();
requestLogger(app);

// Security + Compression
app.use(helmet());
app.use(compression());

// ✅ FIXED CORS BLOCK
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:8080',
  'http://localhost:19006',
  ...(Array.isArray(config.server.corsOrigin) ? config.server.corsOrigin : [])
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  const isAllowed = 
    allowedOrigins.includes(origin) ||
    (origin && origin.endsWith('.exp.direct')) ||
    (origin && origin.endsWith('.ngrok-free.app'));

  if (isAllowed && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    req.headers['access-control-request-headers'] || 'Content-Type, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Stripe webhook (before body parser)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiPrefix = `/api/${config.server.apiVersion}`;

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

app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

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
