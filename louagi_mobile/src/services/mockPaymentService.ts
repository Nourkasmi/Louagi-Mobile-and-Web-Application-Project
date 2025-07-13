// src/services/mockPaymentService.ts - FIXED Working Mock Payment
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

// Mock card data that matches your UI
const MOCK_CARDS = [
    {
        id: 'visa_4242',
        brand: 'Visa',
        number: '4242424242424242',
        last4: '4242',
        expiry: '12/26',
        cvc: '123',
        success: true,
        delay: 2000,
        name: 'Visa Success Card',
        description: 'Always succeeds'
    },
    {
        id: 'mastercard_5555',
        brand: 'MasterCard',
        number: '5555555555554444',
        last4: '5555',
        expiry: '11/25',
        cvc: '456',
        success: true,
        delay: 1800,
        name: 'MasterCard Success Card',
        description: 'Always succeeds'
    },
    {
        id: 'amex_1234',
        brand: 'Amex',
        number: '378282246310005',
        last4: '1234',
        expiry: '10/25',
        cvc: '1234',
        success: false,
        delay: 2500,
        error: 'Your card was declined - Insufficient funds',
        name: 'Amex Declined Card',
        description: 'Always declines'
    },
    {
        id: 'visa_0000',
        brand: 'Visa',
        number: '4000000000000000',
        last4: '0000',
        expiry: '09/24',
        cvc: '789',
        success: false,
        delay: 2200,
        error: 'Insufficient funds - Card declined',
        name: 'Visa Insufficient Funds',
        description: 'Insufficient funds error'
    }
];

interface MockPaymentConfig {
    merchantDisplayName: string;
    paymentIntentClientSecret: string;
    defaultBillingDetails?: any;
    allowsDelayedPaymentMethods?: boolean;
    returnURL?: string;
}

class MockPaymentService {
    private isInitialized = false;
    private isProcessing = false;
    private lastPaymentId = 1000;
    private currentConfig: MockPaymentConfig | null = null;

    /**
     * Initialize mock payment sheet - matches Stripe API
     */
    async initPaymentSheet(config: MockPaymentConfig): Promise<{ error?: { message: string; code: string } }> {
        try {
            console.log('🎭 Mock Payment: Initializing payment sheet...');

            // Validate required parameters
            if (!config.merchantDisplayName || !config.paymentIntentClientSecret) {
                return {
                    error: {
                        message: 'Missing required payment configuration',
                        code: 'InvalidConfiguration'
                    }
                };
            }

            // Simulate initialization delay
            await this.delay(800);

            this.currentConfig = config;
            this.isInitialized = true;

            console.log('✅ Mock Payment: Payment sheet initialized successfully');
            console.log(`💳 Merchant: ${config.merchantDisplayName}`);
            console.log(`🔑 Client Secret: ${config.paymentIntentClientSecret.substring(0, 20)}...`);

            return {}; // Success - no error
        } catch (error: any) {
            console.error('❌ Mock Payment: Initialization error:', error);
            return {
                error: {
                    message: error.message || 'Failed to initialize payment sheet',
                    code: 'InitializationFailed'
                }
            };
        }
    }

    /**
     * Present payment sheet - the main payment flow
     */
    async presentPaymentSheet(): Promise<{ error?: { message: string; code: string } }> {
        console.log('🎭 Mock Payment: presentPaymentSheet called');

        // Check if initialized
        if (!this.isInitialized || !this.currentConfig) {
            console.error('❌ Mock Payment: Not initialized');
            return {
                error: {
                    message: 'Payment sheet not initialized. Call initPaymentSheet first.',
                    code: 'NotInitialized'
                }
            };
        }

        // Check if already processing
        if (this.isProcessing) {
            console.error('❌ Mock Payment: Already processing');
            return {
                error: {
                    message: 'Payment already in progress',
                    code: 'PaymentInProgress'
                }
            };
        }

        console.log('🎭 Mock Payment: Presenting payment options...');

        return new Promise((resolve) => {
            this.showPaymentOptions(resolve);
        });
    }

    /**
     * Show main payment options
     */
    private showPaymentOptions(resolve: (value: { error?: { message: string; code: string } }) => void) {
        const merchantName = this.currentConfig?.merchantDisplayName || 'Louagi';

        Alert.alert(
            '💳 Mock Payment Method',
            `Complete payment for ${merchantName}\n\nThis is a test environment - no real money will be charged.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                        console.log('❌ Mock Payment: User cancelled');
                        resolve({
                            error: { message: 'Payment was cancelled', code: 'Canceled' }
                        });
                    }
                },
                {
                    text: 'Test Credit/Debit Cards',
                    onPress: () => this.showTestCards(resolve)
                }
            ],
            { cancelable: true }
        );
    }

    /**
     * Show available test cards
     */
    private showTestCards(resolve: (value: { error?: { message: string; code: string } }) => void) {
        Alert.alert(
            '💳 Available Test Cards',
            'Choose a test card to simulate payment:',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => resolve({
                        error: { message: 'Payment cancelled', code: 'Canceled' }
                    })
                },
                {
                    text: '✅ Visa •••• 4242 - Success',
                    onPress: () => this.processCardPayment(resolve, MOCK_CARDS[0])
                },
                {
                    text: '✅ MasterCard •••• 5555 - Success',
                    onPress: () => this.processCardPayment(resolve, MOCK_CARDS[1])
                },
                {
                    text: '❌ Amex •••• 1234 - Declined',
                    onPress: () => this.processCardPayment(resolve, MOCK_CARDS[2])
                },
                {
                    text: '❌ Visa •••• 0000 - Insufficient Funds',
                    onPress: () => this.processCardPayment(resolve, MOCK_CARDS[3])
                }
            ]
        );
    }

    /**
     * Process selected card payment
     */
    private async processCardPayment(
        resolve: (value: { error?: { message: string; code: string } }) => void,
        card: typeof MOCK_CARDS[0]
    ) {
        try {
            this.isProcessing = true;
            console.log(`🎭 Processing ${card.brand} •••• ${card.last4}...`);

            // Show processing feedback
            const processingAlert = Alert.alert(
                '⏳ Processing Payment',
                `Processing ${card.brand} •••• ${card.last4}\n\nPlease wait...`,
                [],
                { cancelable: false }
            );

            // Simulate processing time
            await this.delay(card.delay);

            // Dismiss processing alert (Android compatibility)
            if (Platform.OS === 'android') {
                // Alert.dismiss is not available on Android, but the alert will be replaced
            }

            if (card.success) {
                // Success
                await this.storeMockPayment(card);
                console.log('✅ Mock Payment: Payment succeeded');

                Alert.alert(
                    '✅ Payment Successful!',
                    `🎭 Mock payment completed successfully!\n\nCard: ${card.brand} •••• ${card.last4}\n\nThis was a test payment - no real money was charged.`,
                    [
                        {
                            text: 'Continue',
                            onPress: () => resolve({}) // Success - no error
                        }
                    ]
                );
            } else {
                // Failure
                console.log('❌ Mock Payment: Payment failed');

                Alert.alert(
                    '❌ Payment Failed',
                    `${card.error}\n\n🎭 This is a test failure - try a different test card.`,
                    [
                        {
                            text: 'Try Again',
                            onPress: () => this.showTestCards(resolve)
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => resolve({
                                error: {
                                    message: card.error || 'Payment failed',
                                    code: 'PaymentFailed'
                                }
                            })
                        }
                    ]
                );
            }
        } catch (error: any) {
            console.error('❌ Mock Payment: Processing error:', error);
            Alert.alert(
                'Payment Error',
                'An error occurred while processing payment. Please try again.',
                [
                    {
                        text: 'OK',
                        onPress: () => resolve({
                            error: {
                                message: error.message || 'Payment processing failed',
                                code: 'ProcessingError'
                            }
                        })
                    }
                ]
            );
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Store mock payment data
     */
    private async storeMockPayment(card: typeof MOCK_CARDS[0]): Promise<void> {
        try {
            const paymentId = `mock_${++this.lastPaymentId}`;
            const paymentData = {
                id: paymentId,
                brand: card.brand,
                last4: card.last4,
                timestamp: new Date().toISOString(),
                status: 'completed',
                mock: true,
                cardName: card.name,
                merchantName: this.currentConfig?.merchantDisplayName || 'Louagi'
            };

            await AsyncStorage.setItem('last_mock_payment', JSON.stringify(paymentData));
            console.log('💾 Mock payment stored:', paymentData);
        } catch (error) {
            console.error('Error storing mock payment:', error);
        }
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get mock cards for display
     */
    getMockCards() {
        return MOCK_CARDS;
    }

    /**
     * Reset the service
     */
    reset() {
        this.isInitialized = false;
        this.isProcessing = false;
        this.currentConfig = null;
        console.log('🔄 Mock Payment Service reset');
    }

    /**
     * Get last payment
     */
    async getLastPayment() {
        try {
            const data = await AsyncStorage.getItem('last_mock_payment');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting last payment:', error);
            return null;
        }
    }
}

// Export singleton instance
export const mockPaymentService = new MockPaymentService();

// Mock Stripe Provider Component
export const MockStripeProvider: React.FC<{
    children: React.ReactNode;
    publishableKey: string;
}> = ({ children, publishableKey }) => {
    React.useEffect(() => {
        console.log('🎭 Mock Stripe Provider initialized');
        console.log('🔑 Mock publishable key:', publishableKey);
    }, [publishableKey]);

    return React.createElement(React.Fragment, null, children);
};

// Mock usePaymentSheet hook that matches Stripe's API
export const useMockPaymentSheet = () => {
    const [loading, setLoading] = React.useState(false);

    const initPaymentSheet = React.useCallback(async (config: MockPaymentConfig) => {
        setLoading(true);
        try {
            const result = await mockPaymentService.initPaymentSheet(config);
            return result;
        } finally {
            setLoading(false);
        }
    }, []);

    const presentPaymentSheet = React.useCallback(async () => {
        setLoading(true);
        try {
            const result = await mockPaymentService.presentPaymentSheet();
            return result;
        } finally {
            setLoading(false);
        }
    }, []);

    const resetPaymentSheetCustomer = React.useCallback(() => {
        mockPaymentService.reset();
    }, []);

    return {
        initPaymentSheet,
        presentPaymentSheet,
        resetPaymentSheetCustomer,
        loading
    };
};

// Export everything needed
export default mockPaymentService;
export { MOCK_CARDS };