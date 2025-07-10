// src/services/mockPaymentService.ts - FIXED Manual Entry Issue
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

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

// Fake credit card data for testing
const FAKE_CARDS = [
    {
        brand: 'Visa',
        number: '4242424242424242',
        last4: '4242',
        success: true,
        delay: 2000,
        name: 'Visa Success Card'
    },
    {
        brand: 'MasterCard',
        number: '5555555555554444',
        last4: '4444',
        success: true,
        delay: 1500,
        name: 'MasterCard Success Card'
    },
    {
        brand: 'American Express',
        number: '378282246310005',
        last4: '0005',
        success: false,
        delay: 3000,
        error: 'Card declined - Insufficient funds',
        name: 'Amex Declined Card'
    },
    {
        brand: 'Visa',
        number: '4000000000000002',
        last4: '0002',
        success: false,
        delay: 2500,
        error: 'Card declined - Invalid card',
        name: 'Visa Declined Card'
    },
];

class MockPaymentService {
    private isProcessing = false;
    private lastPaymentId = 1000;

    /**
     * FIXED: Present payment sheet with better manual entry handling
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

        console.log('🎭 Mock Payment: Presenting payment options...');

        return new Promise((resolve) => {
            Alert.alert(
                '💳 Mock Payment Options',
                'Choose how you want to test payment:',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            console.log('❌ Mock: Payment cancelled by user');
                            resolve({
                                error: { message: 'Payment cancelled', code: 'Canceled' }
                            });
                        }
                    },
                    {
                        text: '⚡ Quick Success',
                        onPress: () => this.handleQuickPayment(resolve, true)
                    },
                    {
                        text: '❌ Quick Decline',
                        onPress: () => this.handleQuickPayment(resolve, false)
                    },
                    {
                        text: '🎯 Test Cards',
                        onPress: () => this.showTestCardSelection(resolve)
                    }
                ],
                {
                    cancelable: true,
                    onDismiss: () => resolve({
                        error: { message: 'Payment cancelled', code: 'Canceled' }
                    })
                }
            );
        });
    }

    /**
     * FIXED: Handle quick payment options
     */
    private async handleQuickPayment(
        resolve: (value: { error?: { message: string; code: string } }) => void,
        success: boolean
    ) {
        try {
            this.isProcessing = true;
            console.log(`🎭 Processing quick ${success ? 'success' : 'decline'} payment...`);

            // Simulate processing delay
            await this.delay(1500);

            if (success) {
                // Store successful payment
                const successCard = FAKE_CARDS[0]; // Use Visa success card
                await this.storeFakePayment(successCard);

                console.log('✅ Mock: Quick payment succeeded');
                resolve({});
            } else {
                console.log('❌ Mock: Quick payment declined');
                resolve({
                    error: {
                        message: 'Your card was declined - Insufficient funds',
                        code: 'card_declined'
                    }
                });
            }
        } catch (error: any) {
            console.error('❌ Mock: Quick payment error:', error);
            resolve({
                error: {
                    message: error.message || 'Payment processing failed',
                    code: 'processing_error'
                }
            });
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * FIXED: Show test card selection with manual entry
     */
    private showTestCardSelection(
        resolve: (value: { error?: { message: string; code: string } }) => void
    ) {
        Alert.alert(
            '💳 Test Card Selection',
            'Choose a test card or enter manually:',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => resolve({
                        error: { message: 'Payment cancelled', code: 'Canceled' }
                    })
                },
                {
                    text: '✅ Visa •••• 4242',
                    onPress: () => this.processSelectedCard(resolve, FAKE_CARDS[0])
                },
                {
                    text: '✅ MC •••• 4444',
                    onPress: () => this.processSelectedCard(resolve, FAKE_CARDS[1])
                },
                {
                    text: '❌ Amex •••• 0005',
                    onPress: () => this.processSelectedCard(resolve, FAKE_CARDS[2])
                },
                {
                    text: '✍️ Manual Entry',
                    onPress: () => this.showManualEntry(resolve)
                }
            ]
        );
    }

    /**
     * FIXED: Process selected test card
     */
    private async processSelectedCard(
        resolve: (value: { error?: { message: string; code: string } }) => void,
        card: typeof FAKE_CARDS[0]
    ) {
        try {
            this.isProcessing = true;
            console.log(`🎭 Processing ${card.brand} ${card.last4}...`);

            await this.delay(card.delay);

            if (card.success) {
                await this.storeFakePayment(card);
                console.log('✅ Mock: Card payment succeeded');
                resolve({});
            } else {
                console.log('❌ Mock: Card payment declined');
                resolve({
                    error: {
                        message: card.error || 'Payment failed',
                        code: 'card_declined'
                    }
                });
            }
        } catch (error: any) {
            console.error('❌ Mock: Card processing error:', error);
            resolve({
                error: {
                    message: error.message || 'Payment processing failed',
                    code: 'processing_error'
                }
            });
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * FIXED: Show manual entry with better platform handling
     */
    private showManualEntry(
        resolve: (value: { error?: { message: string; code: string } }) => void
    ) {
        if (Platform.OS === 'ios') {
            // iOS supports Alert.prompt
            Alert.prompt(
                '💳 Enter Card Number',
                'Enter a test card number:\n\n' +
                '✅ 4242424242424242 (Success)\n' +
                '✅ 5555555555554444 (Success)\n' +
                '❌ 4000000000000002 (Declined)\n' +
                '❌ 4000000000000069 (Expired)',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve({
                            error: { message: 'Manual entry cancelled', code: 'Canceled' }
                        })
                    },
                    {
                        text: 'Process Payment',
                        onPress: (cardNumber) => {
                            if (!cardNumber) {
                                resolve({
                                    error: { message: 'No card number entered', code: 'invalid_input' }
                                });
                                return;
                            }
                            this.processManualCard(resolve, cardNumber);
                        }
                    }
                ],
                'plain-text',
                '4242424242424242', // Default value
                'numeric'
            );
        } else {
            // Android doesn't reliably support Alert.prompt, show alternative
            Alert.alert(
                '💳 Manual Entry (Android)',
                'Android manual entry simulation:\n\n' +
                'Choose what would happen if you entered a card:',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve({
                            error: { message: 'Manual entry cancelled', code: 'Canceled' }
                        })
                    },
                    {
                        text: '✅ Success Card',
                        onPress: () => {
                            console.log('🎭 Android: Simulating manual success entry');
                            this.processManualCard(resolve, '4242424242424242');
                        }
                    },
                    {
                        text: '❌ Declined Card',
                        onPress: () => {
                            console.log('🎭 Android: Simulating manual decline entry');
                            this.processManualCard(resolve, '4000000000000002');
                        }
                    },
                    {
                        text: '🎲 Random Card',
                        onPress: () => {
                            console.log('🎭 Android: Simulating random manual entry');
                            // Generate random 16-digit number
                            const randomCard = '4' + Math.random().toString().slice(2, 16);
                            this.processManualCard(resolve, randomCard);
                        }
                    }
                ]
            );
        }
    }

    /**
     * FIXED: Process manually entered card
     */
    private async processManualCard(
        resolve: (value: { error?: { message: string; code: string } }) => void,
        cardNumber: string
    ) {
        try {
            this.isProcessing = true;
            const cleanCardNumber = cardNumber.replace(/\s/g, '');

            console.log('🎭 Processing manual card:', cleanCardNumber.slice(-4));

            // Validate card number length
            if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
                resolve({
                    error: {
                        message: 'Invalid card number length. Please enter 13-19 digits.',
                        code: 'invalid_card_number'
                    }
                });
                return;
            }

            // Check if it's a known test card
            const testCard = FAKE_CARDS.find(card =>
                cleanCardNumber === card.number
            );

            // Simulate processing delay
            await this.delay(2000);

            if (testCard) {
                // Known test card
                if (testCard.success) {
                    await this.storeFakePayment(testCard);
                    console.log('✅ Mock: Manual entry succeeded (known test card)');
                    resolve({});
                } else {
                    console.log('❌ Mock: Manual entry declined (known test card)');
                    resolve({
                        error: {
                            message: testCard.error || 'Card declined',
                            code: 'card_declined'
                        }
                    });
                }
            } else {
                // Unknown card - simulate random result with 70% success rate
                const isSuccess = Math.random() > 0.3;

                if (isSuccess) {
                    const customCard = {
                        brand: this.getBrandFromNumber(cleanCardNumber),
                        number: cleanCardNumber,
                        last4: cleanCardNumber.slice(-4),
                        success: true,
                        delay: 2000,
                        name: 'Custom Card'
                    };

                    await this.storeFakePayment(customCard);
                    console.log('✅ Mock: Manual entry succeeded (random card)');
                    resolve({});
                } else {
                    console.log('❌ Mock: Manual entry declined (random card)');
                    resolve({
                        error: {
                            message: 'Card declined - Please try a different card',
                            code: 'card_declined'
                        }
                    });
                }
            }
        } catch (error: any) {
            console.error('❌ Mock: Manual card processing error:', error);
            resolve({
                error: {
                    message: error.message || 'Manual entry processing failed',
                    code: 'processing_error'
                }
            });
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Get card brand from number
     */
    private getBrandFromNumber(cardNumber: string): string {
        const number = cardNumber.replace(/\s/g, '');

        if (number.startsWith('4')) return 'Visa';
        if (number.startsWith('5') || number.startsWith('2')) return 'MasterCard';
        if (number.startsWith('3')) return 'American Express';
        if (number.startsWith('6')) return 'Discover';

        return 'Unknown';
    }

    /**
     * Store fake payment data
     */
    private async storeFakePayment(card: any): Promise<void> {
        const paymentId = `mock_payment_${++this.lastPaymentId}`;
        const paymentData = {
            id: paymentId,
            brand: card.brand,
            last4: card.last4,
            timestamp: new Date().toISOString(),
            amount: 0, // Will be set by calling code
            currency: 'USD',
            status: 'completed',
            mock: true,
            cardName: card.name
        };

        await AsyncStorage.setItem('last_mock_payment', JSON.stringify(paymentData));
        console.log('💾 Mock payment stored:', paymentData);
    }

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
        console.log('🎭 Mock Payment: Initializing...', params.merchantDisplayName);

        // Simulate initialization delay
        await this.delay(500);

        console.log('✅ Mock Payment: Ready for testing!');
        return {};
    }

    /**
     * Create mock payment intent
     */
    async createMockPaymentIntent(bookingId: string): Promise<{
        success: boolean;
        clientSecret?: string;
        error?: string;
    }> {
        console.log('🎭 Creating mock payment intent for booking:', bookingId);

        await this.delay(800);

        const clientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;

        return {
            success: true,
            clientSecret
        };
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
        console.log('🗑️ Mock payment data cleared');
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Show test card information
     */
    showTestCardInfo(): void {
        Alert.alert(
            '💳 Test Card Numbers',
            'Use these mock cards for testing:\n\n' +
            '✅ SUCCESS CARDS:\n' +
            '4242424242424242 (Visa)\n' +
            '5555555555554444 (MasterCard)\n\n' +
            '❌ FAILURE CARDS:\n' +
            '4000000000000002 (Declined)\n' +
            '4000000000000069 (Expired)\n\n' +
            '💡 Or enter any 13-19 digit number for random results!',
            [{ text: 'Got it!', style: 'default' }]
        );
    }
}

// Export singleton instance
export const mockPaymentService = new MockPaymentService();

// Mock Stripe Provider Component
export const MockStripeProvider: React.FC<{
    children: React.ReactNode;
    publishableKey: string;
}> = ({ children }) => {
    console.log('🎭 Mock Stripe Provider initialized - No real Stripe needed!');
    return React.createElement(React.Fragment, null, children);
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