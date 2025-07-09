// src/services/paymentService.ts - Enhanced Payment Service
import { Alert, Platform } from 'react-native';
import { initStripe, usePaymentSheet, StripeProvider } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../config';
import {
    createPaymentIntent,
    confirmPayment,
    cancelPayment,
    getSavedPaymentMethods,
    createSetupIntent,
    savePaymentMethod,
    type Booking,
    type Payment,
    type ApiResponse
} from './api';

// Types
export interface PaymentResult {
    success: boolean;
    paymentId?: string;
    error?: string;
    cancelled?: boolean;
}

export interface PaymentMethod {
    id: string;
    type: string;
    card?: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
    };
    created: number;
}

export interface PaymentConfiguration {
    merchantDisplayName: string;
    allowsDelayedPaymentMethods: boolean;
    returnURL: string;
    defaultBillingDetails?: {
        name?: string;
        email?: string;
        phone?: string;
    };
}

// Payment Service Class
class PaymentService {
    private isInitialized = false;
    private savedPaymentMethods: PaymentMethod[] = [];

    constructor() {
        this.initializeStripe();
    }

    /**
     * Initialize Stripe with publishable key
     */
    private async initializeStripe(): Promise<void> {
        try {
            if (this.isInitialized) return;

            await initStripe({
                publishableKey: Config.STRIPE_PUBLISHABLE_KEY,
                merchantIdentifier: 'merchant.com.louagi.mobile', // iOS Apple Pay
                urlScheme: 'louagi', // Deep linking
            });

            this.isInitialized = true;
            console.log('✅ Stripe initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Stripe:', error);
            throw new Error('Payment system initialization failed');
        }
    }

    /**
     * Process booking payment using Payment Sheet
     */
    async processBookingPayment(
        booking: Booking,
        options: Partial<PaymentConfiguration> = {}
    ): Promise<PaymentResult> {
        try {
            if (!this.isInitialized) {
                await this.initializeStripe();
            }

            console.log('💳 Processing payment for booking:', booking.id);

            // Create payment intent
            const paymentIntentResponse = await createPaymentIntent(booking.id);

            if (!paymentIntentResponse.success || !paymentIntentResponse.clientSecret) {
                throw new Error('Failed to create payment intent');
            }

            const clientSecret = paymentIntentResponse.clientSecret;

            // Configure payment sheet
            const configuration: PaymentConfiguration = {
                merchantDisplayName: Config.APP_NAME || 'Louagi',
                allowsDelayedPaymentMethods: false,
                returnURL: 'louagi://payment-success',
                defaultBillingDetails: {
                    name: 'Customer',
                },
                ...options,
            };

            // Initialize payment sheet (this would be done in the component)
            // The actual payment sheet presentation happens in the React component
            // This service provides the configuration and handles the result

            return {
                success: true,
                paymentId: paymentIntentResponse.data?.payment?.id,
            };

        } catch (error: any) {
            console.error('❌ Payment processing failed:', error);

            return {
                success: false,
                error: this.getPaymentErrorMessage(error),
            };
        }
    }

    /**
     * Handle payment success callback
     */
    async handlePaymentSuccess(paymentIntentId: string): Promise<PaymentResult> {
        try {
            console.log('✅ Payment successful:', paymentIntentId);

            // Store successful payment info
            await AsyncStorage.setItem('last_successful_payment', JSON.stringify({
                paymentIntentId,
                timestamp: new Date().toISOString(),
            }));

            return {
                success: true,
                paymentId: paymentIntentId,
            };

        } catch (error: any) {
            console.error('❌ Error handling payment success:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Handle payment cancellation
     */
    async handlePaymentCancellation(reason?: string): Promise<PaymentResult> {
        console.log('⚠️ Payment cancelled:', reason);

        return {
            success: false,
            cancelled: true,
            error: 'Payment was cancelled by user',
        };
    }

    /**
     * Get user's saved payment methods
     */
    async getSavedPaymentMethods(): Promise<PaymentMethod[]> {
        try {
            if (this.savedPaymentMethods.length > 0) {
                return this.savedPaymentMethods;
            }

            const response = await getSavedPaymentMethods();

            if (response.success && response.data) {
                this.savedPaymentMethods = response.data;
                return response.data;
            }

            return [];

        } catch (error) {
            console.error('❌ Failed to get payment methods:', error);
            return [];
        }
    }

    /**
     * Save a new payment method
     */
    async saveNewPaymentMethod(): Promise<{ success: boolean; setupIntentId?: string; error?: string }> {
        try {
            const response = await createSetupIntent();

            if (!response.success || !response.data?.setupIntent) {
                throw new Error('Failed to create setup intent');
            }

            const setupIntent = response.data.setupIntent;

            // The actual payment method saving would be handled by Stripe SDK
            // This returns the setup intent for the UI to process

            return {
                success: true,
                setupIntentId: setupIntent.id,
            };

        } catch (error: any) {
            console.error('❌ Failed to save payment method:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Cancel a payment
     */
    async cancelPayment(paymentId: string, reason?: string): Promise<PaymentResult> {
        try {
            const response = await cancelPayment(paymentId, reason);

            if (response.success) {
                return {
                    success: true,
                    paymentId: response.data?.id,
                };
            }

            throw new Error(response.message || 'Failed to cancel payment');

        } catch (error: any) {
            console.error('❌ Payment cancellation failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId: string): Promise<{
        status: string;
        amount: number;
        currency: string;
        created: number;
    } | null> {
        try {
            // This would call your backend to get payment status
            // For now, return null since we don't have this endpoint
            return null;

        } catch (error) {
            console.error('❌ Failed to get payment status:', error);
            return null;
        }
    }

    /**
     * Validate payment method
     */
    validatePaymentMethod(paymentMethod: any): boolean {
        if (!paymentMethod) return false;

        // Basic validation
        if (paymentMethod.type === 'card') {
            return !!(paymentMethod.card?.last4 && paymentMethod.card?.brand);
        }

        return true;
    }

    /**
     * Format payment amount for display
     */
    formatAmount(amount: number, currency: string = 'USD'): string {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency.toUpperCase(),
            }).format(amount);
        } catch (error) {
            return `$${amount.toFixed(2)}`;
        }
    }

    /**
     * Get user-friendly error message
     */
    private getPaymentErrorMessage(error: any): string {
        if (error.code) {
            switch (error.code) {
                case 'authentication_required':
                    return 'Authentication required. Please verify your payment method.';
                case 'card_declined':
                    return 'Your card was declined. Please try a different payment method.';
                case 'insufficient_funds':
                    return 'Insufficient funds. Please check your account balance.';
                case 'incorrect_cvc':
                    return 'The security code is incorrect. Please check and try again.';
                case 'expired_card':
                    return 'Your card has expired. Please use a different payment method.';
                case 'processing_error':
                    return 'A processing error occurred. Please try again.';
                case 'payment_intent_authentication_failure':
                    return 'Payment authentication failed. Please try again.';
                default:
                    return error.message || 'Payment failed. Please try again.';
            }
        }

        if (error.message) {
            return error.message;
        }

        return 'An unexpected error occurred. Please try again.';
    }

    /**
     * Check if Apple Pay is available
     */
    async isApplePaySupported(): Promise<boolean> {
        if (Platform.OS !== 'ios') return false;

        try {
            // This would use Stripe's isApplePaySupported method
            // For now, return true on iOS
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if Google Pay is available
     */
    async isGooglePaySupported(): Promise<boolean> {
        if (Platform.OS !== 'android') return false;

        try {
            // This would use Stripe's isGooglePaySupported method
            // For now, return true on Android
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Clear cached payment data
     */
    async clearPaymentCache(): Promise<void> {
        try {
            this.savedPaymentMethods = [];
            await AsyncStorage.removeItem('last_successful_payment');
            console.log('✅ Payment cache cleared');
        } catch (error) {
            console.error('❌ Failed to clear payment cache:', error);
        }
    }

    /**
     * Get payment history summary
     */
    async getPaymentHistory(): Promise<{
        totalPaid: number;
        paymentCount: number;
        lastPayment?: Date;
    }> {
        try {
            const lastPaymentData = await AsyncStorage.getItem('last_successful_payment');

            let lastPayment: Date | undefined;
            if (lastPaymentData) {
                const parsed = JSON.parse(lastPaymentData);
                lastPayment = new Date(parsed.timestamp);
            }

            // This would typically fetch from your backend
            // For now, return basic info
            return {
                totalPaid: 0,
                paymentCount: 0,
                lastPayment,
            };

        } catch (error) {
            console.error('❌ Failed to get payment history:', error);
            return {
                totalPaid: 0,
                paymentCount: 0,
            };
        }
    }
}

// Export singleton instance
export const paymentService = new PaymentService();

// Export utility functions
export const formatPaymentAmount = (amount: number, currency: string = 'USD'): string => {
    return paymentService.formatAmount(amount, currency);
};

export const validatePaymentMethod = (paymentMethod: any): boolean => {
    return paymentService.validatePaymentMethod(paymentMethod);
};

// Export hooks for React components
export const usePaymentService = () => {
    return {
        processBookingPayment: paymentService.processBookingPayment.bind(paymentService),
        handlePaymentSuccess: paymentService.handlePaymentSuccess.bind(paymentService),
        handlePaymentCancellation: paymentService.handlePaymentCancellation.bind(paymentService),
        getSavedPaymentMethods: paymentService.getSavedPaymentMethods.bind(paymentService),
        saveNewPaymentMethod: paymentService.saveNewPaymentMethod.bind(paymentService),
        cancelPayment: paymentService.cancelPayment.bind(paymentService),
        isApplePaySupported: paymentService.isApplePaySupported.bind(paymentService),
        isGooglePaySupported: paymentService.isGooglePaySupported.bind(paymentService),
        formatAmount: paymentService.formatAmount.bind(paymentService),
        clearPaymentCache: paymentService.clearPaymentCache.bind(paymentService),
    };
};

export default paymentService;