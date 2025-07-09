// src/services/mockPaymentService.ts - Enhanced Fake Payment Service
import { Alert } from 'react-native';
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
     * Show fake payment form instead of real Stripe
     */
    async presentFakePaymentForm(): Promise<{ error?: { message: string; code: string } }> {
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
            console.log('🎭 Mock: Showing fake payment form...');

            // Show fake card selection
            const selectedCard = await this.showFakeCardSelection();

            if (!selectedCard) {
                console.log('❌ Mock: Payment cancelled by user');
                return {
                    error: {
                        message: 'Payment was cancelled',
                        code: 'Canceled'
                    }
                };
            }

            // Simulate processing
            console.log('🎭 Mock: Processing fake payment...');
            await this.delay(selectedCard.delay);

            if (!selectedCard.success) {
                console.log('❌ Mock: Fake payment failed -', selectedCard.error);
                return {
                    error: {
                        message: selectedCard.error || 'Payment failed',
                        code: selectedCard.error?.toLowerCase().replace(' ', '_') || 'payment_failed'
                    }
                };
            }

            // Payment successful
            console.log('✅ Mock: Fake payment completed successfully!');
            await this.storeFakePayment(selectedCard);

            return {};

        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Show simple fake card selection
     */
    private showFakeCardSelection(): Promise<typeof FAKE_CARDS[0] | null> {
        return new Promise((resolve) => {
            Alert.alert(
                '💳 Fake Payment - Choose Test Card',
                'Select a test card to simulate payment:',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve(null)
                    },
                    {
                        text: '✅ Visa •••• 4242 (Success)',
                        onPress: () => resolve(FAKE_CARDS[0])
                    },
                    {
                        text: '✅ MasterCard •••• 4444 (Success)',
                        onPress: () => resolve(FAKE_CARDS[1])
                    },
                    {
                        text: '❌ Amex •••• 0005 (Declined)',
                        onPress: () => resolve(FAKE_CARDS[2])
                    },
                    {
                        text: '❌ Visa •••• 0002 (Invalid)',
                        onPress: () => resolve(FAKE_CARDS[3])
                    },
                ],
                { cancelable: true, onDismiss: () => resolve(null) }
            );
        });
    }

    /**
     * Show manual card entry form (fake)
     */
    async showFakeCardEntryForm(): Promise<{ error?: { message: string; code: string } }> {
        return new Promise((resolve) => {
            Alert.prompt(
                '💳 Enter Fake Card Details',
                'Enter any fake card number (or use test cards):\n\n' +
                '✅ 4242424242424242 (Success)\n' +
                '✅ 5555555555554444 (Success)\n' +
                '❌ 4000000000000002 (Declined)\n' +
                '❌ 4000000000000069 (Expired)',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve({
                            error: { message: 'Payment cancelled', code: 'Canceled' }
                        })
                    },
                    {
                        text: 'Pay Now',
                        onPress: async (cardNumber) => {
                            if (!cardNumber || cardNumber.length < 13) {
                                resolve({
                                    error: {
                                        message: 'Invalid card number',
                                        code: 'invalid_card'
                                    }
                                });
                                return;
                            }

                            const result = await this.processFakeCard(cardNumber);
                            resolve(result);
                        }
                    }
                ],
                'plain-text',
                '4242424242424242', // Default value
                'numeric'
            );
        });
    }

    /**
     * Process fake card based on number
     */
    private async processFakeCard(cardNumber: string): Promise<{ error?: { message: string; code: string } }> {
        console.log('🎭 Processing fake card:', cardNumber.slice(-4));

        // Simulate processing delay
        await this.delay(2000);

        // Check if it's a test card
        const testCard = FAKE_CARDS.find(card =>
            cardNumber.replace(/\s/g, '') === card.number
        );

        if (testCard) {
            if (testCard.success) {
                await this.storeFakePayment(testCard);
                return {};
            } else {
                return {
                    error: {
                        message: testCard.error || 'Card declined',
                        code: 'card_declined'
                    }
                };
            }
        }

        // For any other number, randomly succeed or fail
        const isSuccess = Math.random() > 0.3; // 70% success rate

        if (isSuccess) {
            const fakeCard = {
                brand: this.getBrandFromNumber(cardNumber),
                number: cardNumber,
                last4: cardNumber.slice(-4),
                success: true,
                delay: 2000,
                name: 'Custom Test Card'
            };
            await this.storeFakePayment(fakeCard);
            return {};
        } else {
            return {
                error: {
                    message: 'Card declined - Insufficient funds',
                    code: 'card_declined'
                }
            };
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
    private async storeFakePayment(card: typeof FAKE_CARDS[0]): Promise<void> {
        const paymentId = `fake_payment_${++this.lastPaymentId}`;
        const paymentData = {
            id: paymentId,
            brand: card.brand,
            last4: card.last4,
            timestamp: new Date().toISOString(),
            amount: 0, // Will be set by calling code
            currency: 'USD',
            status: 'completed',
            fake: true,
            cardName: card.name
        };

        await AsyncStorage.setItem('last_fake_payment', JSON.stringify(paymentData));
        console.log('💾 Fake payment stored:', paymentData);
    }

    /**
     * Initialize fake payment sheet
     */
    async initPaymentSheet(params: {
        merchantDisplayName: string;
        paymentIntentClientSecret: string;
        defaultBillingDetails?: any;
        allowsDelayedPaymentMethods?: boolean;
        returnURL?: string;
    }): Promise<{ error?: { message: string; code: string } }> {
        console.log('🎭 Fake Payment: Initializing...', params.merchantDisplayName);

        // Simulate initialization delay
        await this.delay(500);

        console.log('✅ Fake Payment: Ready for testing!');
        return {};
    }

    /**
     * Present fake payment sheet (main method used by app)
     */
    async presentPaymentSheet(): Promise<{ error?: { message: string; code: string } }> {
        console.log('🎭 Fake Payment: Presenting payment options...');

        return new Promise((resolve) => {
            Alert.alert(
                '💳 Fake Payment Options',
                'Choose how you want to test payment:',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => resolve({
                            error: { message: 'Payment cancelled', code: 'Canceled' }
                        })
                    },
                    {
                        text: '🎯 Quick Test Cards',
                        onPress: async () => {
                            const result = await this.presentFakePaymentForm();
                            resolve(result);
                        }
                    },
                    {
                        text: '✍️ Manual Entry',
                        onPress: async () => {
                            const result = await this.showFakeCardEntryForm();
                            resolve(result);
                        }
                    }
                ],
                {
                    cancelable: true, onDismiss: () => resolve({
                        error: { message: 'Payment cancelled', code: 'Canceled' }
                    })
                }
            );
        });
    }

    /**
     * Create fake payment intent
     */
    async createFakePaymentIntent(bookingId: string): Promise<{
        success: boolean;
        clientSecret?: string;
        error?: string;
    }> {
        console.log('🎭 Creating fake payment intent for booking:', bookingId);

        await this.delay(800);

        const clientSecret = `pi_fake_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;

        return {
            success: true,
            clientSecret
        };
    }

    /**
     * Get fake payment history
     */
    async getFakePaymentHistory(): Promise<any[]> {
        try {
            const lastPayment = await AsyncStorage.getItem('last_fake_payment');
            return lastPayment ? [JSON.parse(lastPayment)] : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Clear fake payment data
     */
    async clearFakeData(): Promise<void> {
        await AsyncStorage.removeItem('last_fake_payment');
        console.log('🗑️ Fake payment data cleared');
    }

    /**
     * Utility delay function
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Show payment success message
     */
    showSuccessMessage(amount: string): void {
        Alert.alert(
            '🎉 Fake Payment Successful!',
            `Your test payment of $${amount} was processed successfully!\n\n` +
            `💡 This was a simulated payment - no real money was charged.\n\n` +
            `✅ Your booking is now confirmed!`,
            [{ text: 'Great!', style: 'default' }]
        );
    }

    /**
     * Show test card information
     */
    showTestCardInfo(): void {
        Alert.alert(
            '💳 Test Card Numbers',
            'Use these fake cards for testing:\n\n' +
            '✅ SUCCESS CARDS:\n' +
            '4242424242424242 (Visa)\n' +
            '5555555555554444 (MasterCard)\n\n' +
            '❌ FAILURE CARDS:\n' +
            '4000000000000002 (Declined)\n' +
            '4000000000000069 (Expired)\n\n' +
            '💡 You can also enter any 16-digit number!',
            [{ text: 'Got it!', style: 'default' }]
        );
    }
}

// Export singleton instance
export const mockPaymentService = new MockPaymentService();

// Fake Stripe Provider Component
export const MockStripeProvider: React.FC<{
    children: React.ReactNode;
    publishableKey: string
}> = ({ children }) => {
    console.log('🎭 Fake Stripe Provider initialized - No real Stripe needed!');
    return React.createElement(React.Fragment, null, children);
};

// Fake usePaymentSheet hook
export const useMockPaymentSheet = () => {
    return {
        initPaymentSheet: mockPaymentService.initPaymentSheet.bind(mockPaymentService),
        presentPaymentSheet: mockPaymentService.presentPaymentSheet.bind(mockPaymentService),
        loading: false
    };
};

// Export aliases for consistency
export const useFakePaymentSheet = useMockPaymentSheet;
export const FakeStripeProvider = MockStripeProvider;

export default mockPaymentService;