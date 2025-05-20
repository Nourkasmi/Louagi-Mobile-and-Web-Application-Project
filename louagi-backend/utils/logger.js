const winston = require('winston');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Ensure log directory exists
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const { combine, timestamp, printf, colorize, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `[${timestamp}] ${level}: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ''
  }`;
});

// Create Winston transport configurations
const transports = [
  // Console transport for all environments
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp(),
      logFormat
    )
  })
];

// Add file transports in production environment
if (config.server.env === 'production') {
  transports.push(
    // Error log file transport
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: combine(
        timestamp(),
        json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file transport
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: combine(
        timestamp(),
        json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create Winston logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  levels: winston.config.npm.levels,
  transports
});

// Morgan request logger middleware factory
const requestLogger = (app) => {
  // Skip logging in test environment
  if (config.server.env === 'test') {
    return;
  }

  // Log to console in all environments
  app.use(morgan(config.logging.requestFormat, {
    stream: {
      write: (message) => logger.http(message.trim())
    }
  }));

  // Log to file in production
  if (config.server.env === 'production') {
    const accessLogStream = fs.createWriteStream(
      path.join(logDir, 'access.log'),
      { flags: 'a' }
    );
    
    app.use(morgan('combined', {
      stream: accessLogStream
    }));
  }
};

module.exports = {
  logger,
  requestLogger
};
