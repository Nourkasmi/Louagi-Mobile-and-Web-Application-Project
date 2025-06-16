// src/config/index.ts - Updated Configuration
const Config = {
  // API Configuration
  API_BASE_URL: __DEV__ 
    ? 'https://eaf3-197-0-185-236.ngrok-free.app/api' // Replace with your ngrok URL
    : 'https://your-production-api.com/api',
  
  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: __DEV__
    ? 'pk_test_51234567890abcdef' // Replace with your Stripe test publishable key
    : 'pk_live_real_key_here', // Replace with your Stripe live publishable key
  
  // App Configuration
  APP_NAME: 'Louagi',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  FEATURES: {
    OFFLINE_MODE: true,
    PUSH_NOTIFICATIONS: true,
    DRIVER_QUEUE_REALTIME: true,
    CAPACITY_BASED_TRIPS: true,
    AUTO_START_TRIPS: true,
    PAYMENT_METHODS_SAVE: true,
    ANALYTICS: true,
  },
  
  // API Timeouts
  TIMEOUTS: {
    DEFAULT: 10000, // 10 seconds
    UPLOAD: 30000,  // 30 seconds
    PAYMENT: 60000, // 60 seconds
  },
  
  // Refresh Intervals (milliseconds)
  REFRESH_INTERVALS: {
    TRIP_CAPACITY: 30000,    // 30 seconds
    DRIVER_STATUS: 15000,    // 15 seconds
    PASSENGER_TRIPS: 60000,  // 1 minute
    QUEUE_POSITION: 10000,   // 10 seconds
  },
  
  // Trip Configuration
  TRIP_CONFIG: {
    MAX_SEATS_PER_BOOKING: 4,
    CANCELLATION_DEADLINE_HOURS: 1,
    AUTO_REFRESH_ENABLED: true,
    CAPACITY_VISUAL_ENABLED: true,
  },
  
  // Driver Configuration
  DRIVER_CONFIG: {
    DEFAULT_VEHICLE_CAPACITY: 4,
    MAX_DAILY_TRIPS: 20,
    EARNINGS_PERCENTAGE: 80, // Driver gets 80%, company gets 20%
    QUEUE_AUTO_REFRESH: true,
  },
  
  // Payment Configuration
  PAYMENT_CONFIG: {
    SUPPORTED_CURRENCIES: ['USD', 'TND'],
    DEFAULT_CURRENCY: 'USD',
    PROCESSING_FEE_PERCENTAGE: 2.9,
    PROCESSING_FEE_FIXED: 0.30,
    REFUND_PROCESSING_DAYS: 5,
  },
  
  // Notification Configuration
  NOTIFICATION_CONFIG: {
    TRIP_REMINDERS_ENABLED: true,
    REMINDER_MINUTES_BEFORE: 30,
    CAPACITY_ALERTS_ENABLED: true,
    PAYMENT_CONFIRMATIONS: true,
  },
  
  // Colors
  COLORS: {
    PRIMARY: '#0066cc',
    SECONDARY: '#28a745',
    WARNING: '#ffc107',
    DANGER: '#dc3545',
    SUCCESS: '#28a745',
    INFO: '#007bff',
    LIGHT: '#f8f9fa',
    DARK: '#333333',
  },
};

export default Config;
