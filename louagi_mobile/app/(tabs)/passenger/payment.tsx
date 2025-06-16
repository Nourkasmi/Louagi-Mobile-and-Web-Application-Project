// app/(tabs)/passenger/PaymentScreen.tsx - Real Stripe Integration
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStripe, CardField, StripeProvider } from '@stripe/stripe-react-native';
import { 
  getBookingById, 
  processStripePayment,
  getSavedPaymentMethods,
  createSetupIntent,
  savePaymentMethod,
  type Booking 
} from '../../../src/services/api';
import Config from '../../../src/config';

export default function PaymentScreen() {
  const {
    bookingId,
    clientSecret,
    amount,
    bookingReference,
  } = useLocalSearchParams<{
    bookingId: string;
    clientSecret: string;
    amount: string;
    bookingReference: string;
  }>();

  const router = useRouter();
  const { confirmPayment, createPaymentMethod } = useStripe();
  
  // State management
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  // Fetch booking details and saved payment methods
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch booking details
        if (bookingId) {
          const bookingResponse = await getBookingById(bookingId);
          if (bookingResponse.success && bookingResponse.data) {
            setBooking(bookingResponse.data);
          }
        }

        // Fetch saved payment methods
        const methodsResponse = await getSavedPaymentMethods();
        if (methodsResponse.success && methodsResponse.data) {
          setSavedPaymentMethods(methodsResponse.data);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  // Handle payment with new card
  const handlePaymentWithNewCard = async () => {
    if (!clientSecret || !cardComplete) {
      Alert.alert('Error', 'Please complete your card information');
      return;
    }

    setProcessing(true);

    try {
      // Create payment method if saving card
      let paymentMethodId: string | undefined;

      if (saveCard) {
        const { paymentMethod, error: pmError } = await createPaymentMethod({
          paymentMethodType: 'Card',
        });

        if (pmError) {
          Alert.alert('Error', pmError.message);
          return;
        }

        paymentMethodId = paymentMethod?.id;

        // Save payment method on backend
        if (paymentMethodId) {
          const setupResponse = await createSetupIntent();
          if (setupResponse.success) {
            await savePaymentMethod(setupResponse.data.setupIntent.id);
          }
        }
      }

      // Confirm payment
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: paymentMethodId ? {
          paymentMethodId
        } : undefined,
      });

      if (error) {
        Alert.alert('Payment Failed', error.message);
        return;
      }

      if (paymentIntent) {
        handlePaymentSuccess(paymentIntent);
      }

    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle payment with saved method
  const handlePaymentWithSavedMethod = async () => {
    if (!selectedPaymentMethod || !clientSecret) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setProcessing(true);

    try {
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          paymentMethodId: selectedPaymentMethod
        }
      });

      if (error) {
        Alert.alert('Payment Failed', error.message);
        return;
      }

      if (paymentIntent) {
        handlePaymentSuccess(paymentIntent);
      }

    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = (paymentIntent: any) => {
    Alert.alert(
      'Payment Successful!',
      `Your booking ${bookingReference} has been confirmed.\n\nPayment ID: ${paymentIntent.id}`,
      [
        {
          text: 'View My Bookings',
          onPress: () => {
            router.replace('/(tabs)/passenger/history');
          },
        },
      ]
    );
  };

  // Render saved payment methods
  const renderSavedPaymentMethods = () => {
    if (savedPaymentMethods.length === 0) return null;

    return (
      <View style={styles.savedMethodsSection}>
        <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
        
        {savedPaymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.savedMethodCard,
              selectedPaymentMethod === method.id && styles.selectedMethodCard
            ]}
            onPress={() => setSelectedPaymentMethod(method.id)}
          >
            <View style={styles.methodInfo}>
              <Text style={styles.methodBrand}>
                {method.card.brand.toUpperCase()} •••• {method.card.last4}
              </Text>
              <Text style={styles.methodExpiry}>
                Expires {method.card.exp_month}/{method.card.exp_year}
              </Text>
            </View>
            
            <View style={[
              styles.radioButton,
              selectedPaymentMethod === method.id && styles.radioButtonSelected
            ]} />
          </TouchableOpacity>
        ))}
        
        {selectedPaymentMethod && (
          <TouchableOpacity
            style={[styles.payButton, processing && styles.payButtonDisabled]}
            onPress={handlePaymentWithSavedMethod}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.payButtonText}>
                Pay ${amount} with saved card
              </Text>
            )}
          </TouchableOpacity>
        )}
        
        <View style={styles.orDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>
      </View>
    );
  };

  // Render new card section
  const renderNewCardSection = () => (
    <View style={styles.newCardSection}>
      <Text style={styles.sectionTitle}>
        {savedPaymentMethods.length > 0 ? 'Use New Card' : 'Payment Method'}
      </Text>
      
      <View style={styles.cardFieldContainer}>
        <CardField
          postalCodeEnabled={false}
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={styles.cardField}
          style={styles.cardFieldWrapper}
          onCardChange={(cardDetails) => {
            setCardComplete(cardDetails.complete);
          }}
        />
      </View>
      
      <TouchableOpacity
        style={styles.saveCardOption}
        onPress={() => setSaveCard(!saveCard)}
      >
        <View style={[
          styles.checkbox,
          saveCard && styles.checkboxChecked
        ]}>
          {saveCard && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.saveCardText}>Save this card for future payments</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.payButton,
          (!cardComplete || processing) && styles.payButtonDisabled
        ]}
        onPress={handlePaymentWithNewCard}
        disabled={!cardComplete || processing}
      >
        {processing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.payButtonText}>
            Pay ${amount}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Booking not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <StripeProvider publishableKey={Config.STRIPE_PUBLISHABLE_KEY}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Complete Payment</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Booking Summary */}
        <View style={styles.bookingSummary}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Route</Text>
            <Text style={styles.summaryValue}>{booking.trip.route.description}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Departure</Text>
            <Text style={styles.summaryValue}>
              {new Date(booking.trip.departureTime).toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })}
            </Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Seats</Text>
            <Text style={styles.summaryValue}>{booking.seats}</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Reference</Text>
            <Text style={styles.summaryValue}>#{bookingReference}</Text>
          </View>
          
          <View style={[styles.summaryItem, styles.totalItem]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>${amount}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        {renderSavedPaymentMethods()}
        {renderNewCardSection()}

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityText}>
            🔒 Your payment information is encrypted and secure
          </Text>
          <Text style={styles.securityText}>
            💳 Powered by Stripe - Industry leading payment security
          </Text>
          <Text style={styles.securityText}>
            📧 Receipt will be sent to your email
          </Text>
        </View>

        {/* Terms */}
        <Text style={styles.termsText}>
          By completing this payment, you agree to our terms of service and privacy policy.
          Your booking will be confirmed once payment is processed successfully.
        </Text>
      </ScrollView>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '600',
  },
  bookingSummary: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  savedMethodsSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  savedMethodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedMethodCard: {
    borderColor: '#0066cc',
    backgroundColor: '#f0f8ff',
  },
  methodInfo: {
    flex: 1,
  },
  methodBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodExpiry: {
    fontSize: 14,
    color: '#666',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  radioButtonSelected: {
    borderColor: '#0066cc',
    backgroundColor: '#0066cc',
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  newCardSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardFieldContainer: {
    marginBottom: 20,
  },
  cardFieldWrapper: {
    height: 50,
  },
  cardField: {
    backgroundColor: '#FFFFFF',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
  },
  saveCardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveCardText: {
    fontSize: 14,
    color: '#666',
  },
  payButton: {
    backgroundColor: '#0066cc',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  securityInfo: {
    backgroundColor: '#f0f8ff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  securityText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  termsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 32,
    lineHeight: 18,
  },
});
