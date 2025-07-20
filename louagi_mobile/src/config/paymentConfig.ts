// src/config/paymentConfig.ts 
import Config from './index';

//  PAYMENT MODE CONFIGURATION
// Set this to 'fake' for completely fake payments (no real card data needed)
export const PAYMENT_MODE: 'fake' | 'mock' | 'real' = 'fake'; 

// Payment configuration based on mode
export const paymentConfig = {
    mode: PAYMENT_MODE,
    isFakeMode: PAYMENT_MODE === 'fake',
    isMockMode: PAYMENT_MODE === 'mock',
    isRealMode: PAYMENT_MODE === 'real',

    // Fake payment settings (completely simulated)
    fake: {
        autoSuccessRate: 0.8, // 80% success rate
        processingDelay: 2000, // 2 seconds delay
        showTestCards: true,   // Show test card options
        allowManualEntry: true, // Allow typing any card number
        requireCVV: false,     // Don't require CVV
        requireExpiry: false,  // Don't require expiry date
    },

    // Stripe configuration
    stripe: {
        publishableKey: PAYMENT_MODE === 'fake'
            ? 'fake_publishable_key'
            : PAYMENT_MODE === 'mock'
                ? 'mock_publishable_key'
                : Config.STRIPE_PUBLISHABLE_KEY,

        // Mock payment settings (still uses some Stripe structure)
        mock: {
            autoSuccessRate: 0.8,
            processingDelay: 2000,
            showTestCards: true,
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
        buttonText: PAYMENT_MODE === 'fake' ? '🎭 Fake Pay' :
            PAYMENT_MODE === 'mock' ? '🎭 Mock Pay' : 'Pay',
        headerTitle: PAYMENT_MODE === 'fake' ? 'Complete Fake Payment' :
            PAYMENT_MODE === 'mock' ? 'Complete Mock Payment' : 'Complete Payment',
        statusTitle: PAYMENT_MODE === 'fake' ? '🎭 Fake Payment Ready' :
            PAYMENT_MODE === 'mock' ? '🎭 Mock Payment Ready' : 'Payment Ready',
        successTitle: PAYMENT_MODE === 'fake' ? '🎭 Fake Payment Successful!' :
            PAYMENT_MODE === 'mock' ? '🎭 Mock Payment Successful!' : 'Payment Successful!',
        failureTitle: PAYMENT_MODE === 'fake' ? 'Fake Payment Failed' :
            PAYMENT_MODE === 'mock' ? 'Mock Payment Failed' : 'Payment Failed',
    },

    // Colors based on payment mode
    colors: {
        primary: PAYMENT_MODE === 'fake' || PAYMENT_MODE === 'mock' ? '#ff9800' : '#0066cc',
        success: PAYMENT_MODE === 'fake' || PAYMENT_MODE === 'mock' ? '#856404' : '#28a745',
        background: PAYMENT_MODE === 'fake' || PAYMENT_MODE === 'mock' ? '#fff3cd' : '#e3f2fd',
    }
};

// Helper functions
export const getPaymentService = async () => {
    if (PAYMENT_MODE === 'fake' || PAYMENT_MODE === 'mock') {
        const { mockPaymentService } = await import('../services/mockPaymentService');
        return mockPaymentService;
    } else {
        const { paymentService } = await import('../services/paymentService');
        return paymentService;
    }
};

export const getStripeProvider = async () => {
    if (PAYMENT_MODE === 'fake' || PAYMENT_MODE === 'mock') {
        const { MockStripeProvider } = await import('../services/mockPaymentService');
        return MockStripeProvider;
    } else {
        const { StripeProvider } = await import('@stripe/stripe-react-native');
        return StripeProvider;
    }
};

export const getPaymentSheet = () => {
    if (PAYMENT_MODE === 'fake' || PAYMENT_MODE === 'mock') {
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
    console.log(`🎭 Fake Mode: ${paymentConfig.isFakeMode ? 'ENABLED' : 'DISABLED'}`);
    console.log(`🎭 Mock Mode: ${paymentConfig.isMockMode ? 'ENABLED' : 'DISABLED'}`);

    if (PAYMENT_MODE === 'fake') {
        console.log('⚠️  FAKE PAYMENT MODE ACTIVE - Completely simulated payments!');
        console.log('💡 You can enter any card number or use quick test options!');
    } else if (PAYMENT_MODE === 'mock') {
        console.log('⚠️  MOCK PAYMENT MODE ACTIVE - No real money will be charged!');
    } else {
        console.log('💰 REAL PAYMENT MODE ACTIVE - Real transactions will be processed!');
    }
}

export default paymentConfig;