// src/config/index.ts - FIXED Configuration
const Config = {
  // 🌐 Your Backend URL - Updated from the error logs
  API_BASE_URL: 'https://882b-165-50-65-9.ngrok-free.app/api',
  // 💳 Stripe Test Key
  STRIPE_PUBLISHABLE_KEY: 'pk_test_51RVuo6ALVnc4tntayhIZmjEVw4bxb3xhp2ZlJLIzhy5bUP7FU1UWa1cIXOOhUyBq1dGq1SwCyzh6Uw13FSkY0q4200n6PzGxgt',

  // 🎯 App Settings
  APP_NAME: 'Louagi',
  APP_VERSION: '1.0.0',

  // 🎨 Colors
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

  // 🧪 Debug Mode
  DEBUG: __DEV__, // Enable debug logging in development
};

// Debug logging
if (Config.DEBUG) {
  console.log('🔧 Louagi Config Loaded:');
  console.log('📡 API URL:', Config.API_BASE_URL);
  console.log('💳 Stripe Key:', Config.STRIPE_PUBLISHABLE_KEY ? 'Loaded' : 'Missing');
  console.log('🚀 Backend Status: Ready for requests');
}

export default Config;