const http = require('http');
const app = require('./app');
const { logger } = require('./utils/logger');
const config = require('./config/config');
const { sequelize } = require('./models');

// Get port from configuration
const port = config.server.port;
app.set('port', port);

// Create HTTP server
const server = http.createServer(app);

// Handle server errors
const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  switch (error.code) {
    case 'EACCES':
      logger.error(`Port ${port} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`Port ${port} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// Log when server starts listening
const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`Server listening on ${bind} in ${config.server.env} mode`);
};

// Connect to the database then start the server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    // Start HTTP server
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  // Don't exit the process in production, just log the error
  if (config.server.env !== 'production') {
    process.exit(1);
  }
});

// Start the server
startServer();

// For testing purposes
module.exports = server;
