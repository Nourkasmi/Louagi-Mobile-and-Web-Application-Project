// src/config/index.ts - Simple Development Configuration
const Config = {
  // 🌐 Your Backend URL (choose one method below)
  API_BASE_URL: 'https://ccc8-165-50-8-74.ngrok-free.app/api', // ← Update this with YOUR ngrok URL
  
  // 💳 Stripe Test Key (get from https://dashboard.stripe.com)
  STRIPE_PUBLISHABLE_KEY: 'pk_test_51RVuo6ALVnc4tntayhIZmjEVw4bxb3xhp2ZlJLIzhy5bUP7FU1UWa1cIXOOhUyBq1dGq1SwCyzh6Uw13FSkY0q4200n6PzGxgt', // ← Replace with YOUR actual test key
  
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
};

export default Config;