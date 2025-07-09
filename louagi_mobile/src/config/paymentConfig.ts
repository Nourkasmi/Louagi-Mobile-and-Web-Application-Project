// src/config/paymentConfig.ts - Easy switch between Mock and Real Payments
import Config from './index';

// 🎭 PAYMENT MODE CONFIGURATION
// Set this to 'mock' for fake payments or 'real' for actual Stripe payments
export const PAYMENT_MODE: 'mock' | 'real' = 'mock'; // 👈 Change this to switch modes

// Payment configuration based on mode
export const paymentConfig = {
    mode: PAYMENT_MODE,
    isMockMode: PAYMENT_MODE === 'mock',
    isRealMode: PAYMENT_MODE === 'real',

    // Stripe configuration
    stripe: {
        publishableKey: PAYMENT_MODE === 'mock'
            ? 'mock_publishable_key'
            : Config.STRIPE_PUBLISHABLE_KEY,

        // Mock payment settings
        mock: {
            autoSuccessRate: 0.8, // 80% success rate for mock payments
            processingDelay: 2000, // 2 seconds delay to simulate processing
            showTestCards: true,   // Show test card options
        },

        // Real payment settings
        real: {
            merchantDisplayName: Config.APP_NAME || 'Louagi',
            allowsDelayedPaymentMethods: false,
            returnURL: 'louagi://payment-success',
        }
    },

    // Payment method display
    display: {
        buttonText: PAYMENT_MODE === 'mock' ? '🎭 Mock Pay' : 'Pay',
        headerTitle: PAYMENT_MODE === 'mock' ? 'Complete Mock Payment' : 'Complete Payment',
        statusTitle: PAYMENT_MODE === 'mock' ? '🎭 Mock Payment Ready' : 'Payment Ready',
        successTitle: PAYMENT_MODE === 'mock' ? '🎭 Mock Payment Successful!' : 'Payment Successful!',
        failureTitle: PAYMENT_MODE === 'mock' ? 'Mock Payment Failed' : 'Payment Failed',
    },

    // Colors based on payment mode
    colors: {
        primary: PAYMENT_MODE === 'mock' ? '#ff9800' : '#0066cc',
        success: PAYMENT_MODE === 'mock' ? '#856404' : '#28a745',
        background: PAYMENT_MODE === 'mock' ? '#fff3cd' : '#e3f2fd',
    }
};

// Helper functions
export const getPaymentService = async () => {
    if (PAYMENT_MODE === 'mock') {
        const { mockPaymentService } = await import('../services/mockPaymentService');
        return mockPaymentService;
    } else {
        const { paymentService } = await import('../services/paymentService');
        return paymentService;
    }
};

export const getStripeProvider = async () => {
    if (PAYMENT_MODE === 'mock') {
        const { MockStripeProvider } = await import('../services/mockPaymentService');
        return MockStripeProvider;
    } else {
        const { StripeProvider } = await import('@stripe/stripe-react-native');
        return StripeProvider;
    }
};

export const getPaymentSheet = () => {
    if (PAYMENT_MODE === 'mock') {
        const { useMockPaymentSheet } = require('../services/mockPaymentService');
        return useMockPaymentSheet;
    } else {
        const { usePaymentSheet } = require('@stripe/stripe-react-native');
        return usePaymentSheet;
    }
};

// Debug logging
if (__DEV__) {
    console.log('🎯 Payment Mode Configuration:');
    console.log(`📋 Mode: ${PAYMENT_MODE.toUpperCase()}`);
    console.log(`💳 Stripe Key: ${paymentConfig.stripe.publishableKey ? 'Loaded' : 'Missing'}`);
    console.log(`🎨 Primary Color: ${paymentConfig.colors.primary}`);
    console.log(`🎭 Mock Mode: ${paymentConfig.isMockMode ? 'ENABLED' : 'DISABLED'}`);

    if (PAYMENT_MODE === 'mock') {
        console.log('⚠️  MOCK PAYMENT MODE ACTIVE - No real money will be charged!');
    } else {
        console.log('💰 REAL PAYMENT MODE ACTIVE - Real transactions will be processed!');
    }
}

export default paymentConfig;