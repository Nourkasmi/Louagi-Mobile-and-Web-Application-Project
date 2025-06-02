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
const paymentRoutes = require('./routes/payment.routes'); // ✅ NEW: Payment routes
const stationRoutes = require('./routes/station.routes');
const scheduleRoutes = require('./routes/schedule.routes');
const destinationRoutes = require('./routes/destination.routes');
const driverRoutes = require('./routes/driver.routes');
const queueRoutes = require('./routes/queue.routes');

// Create Express app
const app = express();

// Use request logger
requestLogger(app);

// Apply middlewares
app.use(helmet()); // Security headers
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(compression()); // Compress responses

// ✅ IMPORTANT: Special handling for Stripe webhooks (raw body needed)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Parse JSON request bodies for all other routes
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// API routes 
const apiPrefix = `/api/${config.server.apiVersion}`;

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes); // ✅ NEW: Payment routes
app.use('/api/stations', stationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/queues', queueRoutes);

// API health check endpoint
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

// Handle 404 errors
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error
  logger.error(`${status} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  
  // Only include stack trace in development
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