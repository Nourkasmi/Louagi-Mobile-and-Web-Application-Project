
const Config = {
<<<<<<< HEAD
  API_BASE_URL: 'https://f2b4b57991f7.ngrok-free.app/api',
=======
  // 🌐 Your Backend URL - Updated from the error logs
  API_BASE_URL: 'https://d41e6b3a9b01.ngrok-free.app/api', // Ensure this is the correct URL for your backend
  // 💳 Stripe Test Key
>>>>>>> f65b7585f36dd370731d32bdf96be86377d62723
  STRIPE_PUBLISHABLE_KEY: 'pk_test_51RVuo6ALVnc4tntayhIZmjEVw4bxb3xhp2ZlJLIzhy5bUP7FU1UWa1cIXOOhUyBq1dGq1SwCyzh6Uw13FSkY0q4200n6PzGxgt',

  APP_NAME: 'Louagi',
  APP_VERSION: '1.0.0',

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

  //  Debug Mode
  DEBUG: __DEV__,
};

if (Config.DEBUG) {
  console.log('🔧 Louagi Config Loaded:');
  console.log('📡 API URL:', Config.API_BASE_URL);
  console.log('💳 Stripe Key:', Config.STRIPE_PUBLISHABLE_KEY ? 'Loaded' : 'Missing');
  console.log('🚀 Backend Status: Ready for requests');
}

export default Config;