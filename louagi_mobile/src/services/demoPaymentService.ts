// src/services/demoPaymentService.ts - Enhanced Demo Payment with Stripe-like UI
import React, { useState } from 'react';
import { Alert, Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Demo card data that looks realistic
const DEMO_CARDS = [
    {
        id: 'visa_success',
        brand: 'visa',
        number: '4242424242424242',
        last4: '4242',
        expiry: '12/26',
        cvc: '123',
        success: true,
        delay: 2000,
        name: 'Visa Success Card',
        color: '#1a1f71',
        description: 'Always succeeds'
    },
    {
        id: 'mastercard_success',
        brand: 'mastercard',
        number: '5555555555554444',
        last4: '4444',
        expiry: '11/25',
        cvc: '456',
        success: true,
        delay: 1500,
        name: 'MasterCard Success Card',
        color: '#eb001b',
        description: 'Always succeeds'
    },
    {
        id: 'amex_declined',
        brand: 'amex',
        number: '378282246310005',
        last4: '0005',
        expiry: '10/25',
        cvc: '1234',
        success: false,
        delay: 3000,
        error: 'Your card was declined - Insufficient funds',
        name: 'Amex Declined Card',
        color: '#006fcf',
        description: 'Always declines'
    },
    {
        id: 'visa_expired',
        brand: 'visa',
        number: '4000000000000069',
        last4: '0069',
        expiry: '01/23',
        cvc: '789',
        success: false,
        delay: 2500,
        error: 'Your card has expired',
        name: 'Visa Expired Card',
        color: '#1a1f71',
        description: 'Expired card error'
    },
];

// Demo Payment Modal Component
const DemoPaymentModal: React.FC<{
    visible: boolean;
    amount: string;
    currency?: string;
    merchantName?: string;
    onSuccess: () => void;
    onError: (error: string) => void;
    onCancel: () => void;
}> = ({
    visible,
    amount,
    currency = 'USD',
    merchantName = 'Louagi',
    onSuccess,
    onError,
    onCancel
}) => {
        const [step, setStep] = useState<'select' | 'form' | 'processing'>('select');
        const [selectedCard, setSelectedCard] = useState<typeof DEMO_CARDS[0] | null>(null);
        const [customCard, setCustomCard] = useState({
            number: '',
            expiry: '',
            cvc: '',
            name: ''
        });
        const [processing, setProcessing] = useState(false);

        const getBrandIcon = (brand: string) => {
            const icons: Record<string, string> = {
                visa: '💳',
                mastercard: '💳',
                amex: '💳',
                discover: '💳'
            };
            return icons[brand] || '💳';
        };

        const formatCardNumber = (value: string) => {
            return value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
        };

        const formatExpiry = (value: string) => {
            return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
        };

        const processPayment = async (card: typeof DEMO_CARDS[0]) => {
            setProcessing(true);
            setStep('processing');

            try {
                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, card.delay));

                // Store demo payment
                const paymentData = {
                    id: `demo_payment_${Date.now()}`,
                    brand: card.brand,
                    last4: card.last4,
                    amount: parseFloat(amount),
                    currency,
                    timestamp: new Date().toISOString(),
                    status: card.success ? 'succeeded' : 'failed',
                    error: card.error,
                    demo: true
                };

                await AsyncStorage.setItem('last_demo_payment', JSON.stringify(paymentData));

                if (card.success) {
                    onSuccess();
                } else {
                    onError(card.error || 'Payment failed');
                }
            } catch (error) {
                onError('Processing error occurred');
            } finally {
                setProcessing(false);
                setStep('select');
                setSelectedCard(null);
            }
        };

        const handleCustomCardSubmit = async () => {
            if (!customCard.number || !customCard.expiry || !customCard.cvc) {
                Alert.alert('Error', 'Please fill in all card details');
                return;
            }

            // Check if it matches a demo card
            const matchedCard = DEMO_CARDS.find(card =>
                customCard.number.replace(/\s/g, '') === card.number
            );

            if (matchedCard) {
                await processPayment(matchedCard);
            } else {
                // Random success/failure for custom cards
                const isSuccess = Math.random() > 0.3;
                const customDemoCard = {
                    ...DEMO_CARDS[0],
                    number: customCard.number,
                    last4: customCard.number.slice(-4),
                    success: isSuccess,
                    error: isSuccess ? undefined : 'Card declined - Please try a different card',
                    delay: 2000
                };
                await processPayment(customDemoCard);
            }
        };

        const renderCardSelection = () => (
            <View style= { styles.modalContent } >
            <View style={ styles.modalHeader }>
                <Text style={ styles.modalTitle }>💳 Demo Payment </Text>
                    < TouchableOpacity onPress = { onCancel } style = { styles.closeButton } >
                        <MaterialIcons name="close" size = { 24} color = "#666" />
                            </TouchableOpacity>
                            </View>

                            < View style = { styles.amountSection } >
                                <Text style={ styles.amountLabel }> Pay { merchantName } </Text>
                                    < Text style = { styles.amountValue } > ${ amount } { currency } </Text>
                                        </View>

                                        < Text style = { styles.sectionTitle } > Choose a demo card: </Text>

        {
            DEMO_CARDS.map((card) => (
                <TouchableOpacity
          key= { card.id }
          style = { [styles.cardOption, { borderColor: card.color }]}
          onPress = {() => processPayment(card)}
        >
    <View style={ styles.cardContent }>
        <View style={ styles.cardLeft }>
            <Text style={ styles.cardIcon }> { getBrandIcon(card.brand) } </Text>
                < View >
                <Text style={ styles.cardBrand }> { card.brand.toUpperCase() } </Text>
                    < Text style = { styles.cardNumber } >•••• •••• •••• { card.last4 } </Text>
                        < Text style = { styles.cardDescription } > { card.description } </Text>
                            </View>
                            </View>
                            < Text style = {
                                [
                                styles.cardStatus,
                                { color: card.success ? '#28a745' : '#dc3545' }
                                ]} >
                                { card.success ? '✅ Success' : '❌ Fails' }
                                </Text>
                                </View>
                                </TouchableOpacity>
      ))}

<TouchableOpacity
        style={ styles.customCardButton }
onPress = {() => setStep('form')}
      >
    <MaterialIcons name="edit" size = { 20} color = "#0066cc" />
        <Text style={ styles.customCardText }> Enter custom card details </Text>
            </TouchableOpacity>

            < Text style = { styles.demoNotice } >
        🎭 This is a demo environment.No real money will be charged.
      </Text>
    </View>
  );

const renderCardForm = () => (
    <View style= { styles.modalContent } >
    <View style={ styles.modalHeader }>
        <TouchableOpacity onPress={ () => setStep('select') } style = { styles.backButton } >
            <MaterialIcons name="arrow-back" size = { 24} color = "#0066cc" />
                </TouchableOpacity>
                < Text style = { styles.modalTitle } >💳 Card Details </Text>
                    < TouchableOpacity onPress = { onCancel } style = { styles.closeButton } >
                        <MaterialIcons name="close" size = { 24} color = "#666" />
                            </TouchableOpacity>
                            </View>

                            < View style = { styles.amountSection } >
                                <Text style={ styles.amountLabel }> Pay { merchantName } </Text>
                                    < Text style = { styles.amountValue } > ${ amount } { currency } </Text>
                                        </View>

                                        < View style = { styles.formSection } >
                                            <Text style={ styles.inputLabel }> Card Number </Text>
                                                < TextInput
style = { styles.textInput }
value = { formatCardNumber(customCard.number) }
onChangeText = {(text) => setCustomCard(prev => ({
    ...prev,
    number: text.replace(/\s/g, '').slice(0, 16)
}))}
placeholder = "1234 5678 9012 3456"
keyboardType = "numeric"
maxLength = { 19}
    />

    <View style={ styles.cardRow }>
        <View style={ styles.cardHalf }>
            <Text style={ styles.inputLabel }> Expiry </Text>
                < TextInput
style = { styles.textInput }
value = { formatExpiry(customCard.expiry) }
onChangeText = {(text) => setCustomCard(prev => ({
    ...prev,
    expiry: text.slice(0, 5)
}))}
placeholder = "MM/YY"
keyboardType = "numeric"
maxLength = { 5}
    />
    </View>
    < View style = { styles.cardHalf } >
        <Text style={ styles.inputLabel }> CVC </Text>
            < TextInput
style = { styles.textInput }
value = { customCard.cvc }
onChangeText = {(text) => setCustomCard(prev => ({
    ...prev,
    cvc: text.replace(/\D/g, '').slice(0, 4)
}))}
placeholder = "123"
keyboardType = "numeric"
maxLength = { 4}
secureTextEntry
    />
    </View>
    </View>

    < Text style = { styles.inputLabel } > Cardholder Name </Text>
        < TextInput
style = { styles.textInput }
value = { customCard.name }
onChangeText = {(text) => setCustomCard(prev => ({ ...prev, name: text }))}
placeholder = "John Doe"
autoCapitalize = "words"
    />
    </View>

    < TouchableOpacity
style = { [styles.payButton, (!customCard.number || !customCard.expiry || !customCard.cvc) && styles.payButtonDisabled]}
onPress = { handleCustomCardSubmit }
disabled = {!customCard.number || !customCard.expiry || !customCard.cvc}
      >
    <Text style={ styles.payButtonText }> Pay ${ amount } </Text>
        </TouchableOpacity>

        < Text style = { styles.testHint } >
        💡 Try: 4242424242424242(success) or 4000000000000002(declined)
    </Text>
    </View>
  );

const renderProcessing = () => (
    <View style= { styles.modalContent } >
    <View style={ styles.processingContainer }>
        <ActivityIndicator size="large" color = "#0066cc" />
            <Text style={ styles.processingText }> Processing payment...</Text>
                < Text style = { styles.processingSubtext } > Please wait while we process your demo payment </Text>
                    </View>
                    </View>
  );

return (
    <Modal
      visible= { visible }
animationType = "slide"
presentationStyle = "pageSheet"
onRequestClose = { onCancel }
    >
    <View style={ styles.modalContainer }>
        { step === 'select' && renderCardSelection()}
{ step === 'form' && renderCardForm() }
{ step === 'processing' && renderProcessing() }
</View>
    </Modal>
  );
};

// Demo Payment Service Class
class DemoPaymentService {
    private currentModal: React.RefObject<any> | null = null;

    async initPaymentSheet(params: {
        merchantDisplayName: string;
        paymentIntentClientSecret: string;
        defaultBillingDetails?: any;
    }): Promise<{ error?: { message: string; code: string } }> {
        console.log('🎭 Demo Payment: Initialized for', params.merchantDisplayName);
        return {};
    }

    async presentPaymentSheet(amount: string, merchantName?: string): Promise<{ error?: { message: string; code: string } }> {
        return new Promise((resolve) => {
            // This would normally show the modal, but we'll use Alert for simplicity
            Alert.alert(
                '💳 Demo Payment',
                `Pay ${merchantName || 'Louagi'} $${amount}`,
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => resolve({ error: { message: 'Payment cancelled', code: 'Canceled' } }) },
                    { text: '✅ Quick Success', onPress: () => this.processQuickPayment(true, resolve) },
                    { text: '❌ Quick Decline', onPress: () => this.processQuickPayment(false, resolve) },
                    { text: '🎯 Choose Card', onPress: () => this.showCardSelection(amount, resolve) }
                ]
            );
        });
    }

    private async processQuickPayment(
        success: boolean,
        resolve: (value: { error?: { message: string; code: string } }) => void
    ) {
        // Simulate processing
        setTimeout(() => {
            if (success) {
                resolve({});
            } else {
                resolve({ error: { message: 'Your card was declined', code: 'card_declined' } });
            }
        }, 2000);
    }

    private showCardSelection(
        amount: string,
        resolve: (value: { error?: { message: string; code: string } }) => void
    ) {
        Alert.alert(
            '💳 Choose Demo Card',
            'Select a test card:',
            [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve({ error: { message: 'Payment cancelled', code: 'Canceled' } }) },
                { text: '✅ Visa 4242', onPress: () => this.processCardPayment(DEMO_CARDS[0], resolve) },
                { text: '✅ MasterCard 4444', onPress: () => this.processCardPayment(DEMO_CARDS[1], resolve) },
                { text: '❌ Amex Declined', onPress: () => this.processCardPayment(DEMO_CARDS[2], resolve) },
                { text: '❌ Visa Expired', onPress: () => this.processCardPayment(DEMO_CARDS[3], resolve) }
            ]
        );
    }

    private async processCardPayment(
        card: typeof DEMO_CARDS[0],
        resolve: (value: { error?: { message: string; code: string } }) => void
    ) {
        // Simulate processing time
        setTimeout(() => {
            if (card.success) {
                resolve({});
            } else {
                resolve({ error: { message: card.error || 'Payment failed', code: 'payment_failed' } });
            }
        }, card.delay);
    }

    async createPaymentIntent(bookingId: string): Promise<{
        success: boolean;
        clientSecret?: string;
        error?: string;
    }> {
        console.log('🎭 Creating demo payment intent for booking:', bookingId);

        const clientSecret = `pi_demo_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;

        return {
            success: true,
            clientSecret
        };
    }

    async getPaymentHistory(): Promise<any[]> {
        try {
            const lastPayment = await AsyncStorage.getItem('last_demo_payment');
            return lastPayment ? [JSON.parse(lastPayment)] : [];
        } catch (error) {
            return [];
        }
    }

    getDemoCards() {
        return DEMO_CARDS;
    }

    showCardInfo(): void {
        const cardInfo = DEMO_CARDS.map(card =>
            `${card.success ? '✅' : '❌'} ${card.brand.toUpperCase()} •••• ${card.last4} - ${card.description}`
        ).join('\n');

        Alert.alert(
            '💳 Demo Cards Available',
            `Use these test cards:\n\n${cardInfo}\n\n💡 Or enter any 16-digit number for random results!`,
            [{ text: 'Got it!', style: 'default' }]
        );
    }
}

// Component and Hook Exports
export const demoPaymentService = new DemoPaymentService();

export const DemoStripeProvider: React.FC<{
    children: React.ReactNode;
    publishableKey: string;
}> = ({ children }) => {
    console.log('🎭 Demo Stripe Provider initialized');
    return React.createElement(React.Fragment, null, children);
};

export const useDemoPaymentSheet = () => {
    return {
        initPaymentSheet: demoPaymentService.initPaymentSheet.bind(demoPaymentService),
        presentPaymentSheet: (amount: string, merchantName?: string) =>
            demoPaymentService.presentPaymentSheet(amount, merchantName),
        loading: false
    };
};

// Export the modal component for advanced usage
export { DemoPaymentModal };

// Styles for the modal
const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    modalContent: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    closeButton: {
        padding: 8,
    },
    backButton: {
        padding: 8,
    },
    amountSection: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    amountLabel: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#0066cc',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 20,
    },
    cardOption: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    cardBrand: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    cardNumber: {
        fontSize: 16,
        color: '#666',
        marginBottom: 2,
    },
    cardDescription: {
        fontSize: 12,
        color: '#888',
    },
    cardStatus: {
        fontSize: 14,
        fontWeight: '600',
    },
    customCardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f8ff',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#0066cc',
    },
    customCardText: {
        fontSize: 16,
        color: '#0066cc',
        fontWeight: '600',
        marginLeft: 8,
    },
    formSection: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f8f9fa',
    },
    cardRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cardHalf: {
        flex: 1,
    },
    payButton: {
        backgroundColor: '#0066cc',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    payButtonDisabled: {
        backgroundColor: '#ccc',
    },
    payButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    testHint: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    processingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
    },
    processingSubtext: {
        fontSize: 14,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    demoNotice: {
        fontSize: 12,
        color: '#ff9800',
        textAlign: 'center',
        marginTop: 20,
        fontWeight: '600',
        backgroundColor: '#fff3cd',
        padding: 12,
        borderRadius: 8,
    },
});

export default demoPaymentService;