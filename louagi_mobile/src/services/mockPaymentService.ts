// src/services/mockPaymentService.ts - Fake Payment Service for Development
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock payment results
export interface MockPaymentResult {
    success: boolean;
    paymentId?: string;
    error?: string;
    cancelled?: boolean;
    mockData?: {
        cardBrand: string;
        last4: string;
        amount: number;
        currency: string;
        processingTime: number;
    };
}

// Mock payment methods
const MOCK_PAYMENT_METHODS = [
    { brand: 'visa', last4: '4242', success: true, delay: 2000 },
    { brand: 'mastercard', last4: '5555', success: true, delay: 1500 },
    { brand: 'amex', last4: '1234', success: false, delay: 3000, error: 'Card declined' },
    { brand: 'visa', last4: '0000', success: false, delay: 2500, error: 'Insufficient funds' },
];

class MockPaymentService {
    private isProcessing = false;
    private lastPaymentId = 1000;

    /**
     * Initialize mock payment sheet
     */
    async initPaymentSheet(params: {
        merchantDisplayName: string;
        paymentIntentClientSecret: string;
        defaultBillingDetails?: any;
        allowsDelayedPaymentMethods?: boolean;
        returnURL?: string;
    }): Promise<{ error?: { message: string; code: string } }> {
        console.log('🎭 Mock: Initializing payment sheet...', params.merchantDisplayName);

        // Simulate initialization delay
        await this.delay(500);

        // Randomly fail initialization sometimes (5% chance)
        if (Math.random() < 0.05) {
            return {
                error: {
                    message: 'Payment initialization failed',
                    code: 'payment_initialization_failed'
                }
            };
        }

        console.log('✅ Mock: Payment sheet initialized successfully');
        return {};
    }

    /**
     * Present mock payment sheet
     */
    async presentPaymentSheet(): Promise<{ error?: { message: string; code: string } }> {
        if (this.isProcessing) {
            return {
                error: {
                    message: 'Payment already in progress',
                    code: 'payment_in_progress'
                }
            };
        }

        try {
            this.isProcessing = true;
            console.log('🎭 Mock: Presenting payment sheet...');

            // Show mock payment selection
            const selectedMethod = await this.showMockPaymentSelection();

            if (!selectedMethod) {
                // User cancelled
                console.log('❌ Mock: Payment cancelled by user');
                return {
                    error: {
                        message: 'Payment was cancelled',
                        code: 'Canceled'
                    }
                };
            }

            // Simulate payment processing
            console.log('🎭 Mock: Processing payment with', selectedMethod);
            await this.delay(selectedMethod.delay);

            if (!selectedMethod.success) {
                // Payment failed
                console.log('❌ Mock: Payment failed -', selectedMethod.error);
                return {
                    error: {
                        message: selectedMethod.error || 'Payment failed',
                        code: selectedMethod.error?.toLowerCase().replace(' ', '_') || 'payment_failed'
                    }
                };
            }

            // Payment successful
            console.log('✅ Mock: Payment completed successfully!');
            await this.storeMockPayment(selectedMethod);

            return {};

        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Show mock payment method selection
     */
    private showMockPaymentSelection(): Promise<typeof MOCK_PAYMENT_METHODS[0] | null> {
        return new Promise((resolve) => {
            // Show alert with payment options
            Alert.alert(
                '🎭 Mock Payment',
                'Choose a test payment method:',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve(null)
                    },
                    {
                        text: '✅ Visa •••• 4242 (Success)',
                        onPress: () => resolve(MOCK_PAYMENT_METHODS[0])
                    },
                    {
                        text: '✅ MasterCard •••• 5555 (Success)',
                        onPress: () => resolve(MOCK_PAYMENT_METHODS[1])
                    },
                    {
                        text: '❌ Amex •••• 1234 (Declined)',
                        onPress: () => resolve(MOCK_PAYMENT_METHODS[2])
                    },
                    {
                        text: '❌ Visa •••• 0000 (No Funds)',
                        onPress: () => resolve(MOCK_PAYMENT_METHODS[3])
                    },
                ],
                { cancelable: true, onDismiss: () => resolve(null) }
            );
        });
    }

    /**
     * Store mock payment data
     */
    private async storeMockPayment(method: typeof MOCK_PAYMENT_METHODS[0]): Promise<void> {
        const paymentId = `mock_payment_${++this.lastPaymentId}`;
        const paymentData = {
            id: paymentId,
            brand: method.brand,
            last4: method.last4,
            timestamp: new Date().toISOString(),
            amount: 0, // Will be set by calling code
            currency: 'USD',
            status: 'completed'
        };

        await AsyncStorage.setItem('last_mock_payment', JSON.stringify(paymentData));
        console.log('💾 Mock: Payment data stored:', paymentData);
    }

    /**
     * Get mock payment history
     */
    async getMockPaymentHistory(): Promise<any[]> {
        try {
            const lastPayment = await AsyncStorage.getItem('last_mock_payment');
            return lastPayment ? [JSON.parse(lastPayment)] : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Clear mock payment data
     */
    async clearMockData(): Promise<void> {
        await AsyncStorage.removeItem('last_mock_payment');
        console.log('🗑️ Mock: Payment data cleared');
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Mock payment intent creation
     */
    async createMockPaymentIntent(bookingId: string): Promise<{
        success: boolean;
        clientSecret?: string;
        error?: string;
    }> {
        console.log('🎭 Mock: Creating payment intent for booking:', bookingId);

        // Simulate API delay
        await this.delay(1000);

        // Generate fake client secret
        const clientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;

        console.log('✅ Mock: Payment intent created:', clientSecret);

        return {
            success: true,
            clientSecret
        };
    }

    /**
     * Simulate payment confirmation
     */
    async confirmMockPayment(paymentIntentId: string): Promise<{
        success: boolean;
        paymentId?: string;
        error?: string;
    }> {
        console.log('🎭 Mock: Confirming payment:', paymentIntentId);

        // Simulate confirmation delay
        await this.delay(1500);

        // 90% success rate
        if (Math.random() < 0.9) {
            const paymentId = `mock_confirmed_${Date.now()}`;
            console.log('✅ Mock: Payment confirmed:', paymentId);

            return {
                success: true,
                paymentId
            };
        } else {
            console.log('❌ Mock: Payment confirmation failed');
            return {
                success: false,
                error: 'Payment confirmation failed - please try again'
            };
        }
    }
}

// Export singleton instance
export const mockPaymentService = new MockPaymentService();

// Mock Stripe Provider Component
export const MockStripeProvider: React.FC<{ children: React.ReactNode; publishableKey: string }> = ({
    children
}) => {
    console.log('🎭 Mock: Stripe Provider initialized');
    return <>{ children } </>;
};

// Mock usePaymentSheet hook
export const useMockPaymentSheet = () => {
    return {
        initPaymentSheet: mockPaymentService.initPaymentSheet.bind(mockPaymentService),
        presentPaymentSheet: mockPaymentService.presentPaymentSheet.bind(mockPaymentService),
        loading: false
    };
};

export default mockPaymentService;