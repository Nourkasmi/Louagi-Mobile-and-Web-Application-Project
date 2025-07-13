// app/(passenger)/payment.tsx - FIXED Payment Screen with Working Mock Payment
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
import { MaterialIcons } from '@expo/vector-icons';

// Import FIXED mock payment service
import {
  MockStripeProvider,
  useMockPaymentSheet,
  mockPaymentService,
  MOCK_CARDS
} from '../../src/services/mockPaymentService';

import { getBookingById, type Booking } from '../../src/services/api';

// Payment Content Component with FIXED Mock Payment
function PaymentContent() {
  const {
    bookingId,
    amount,
    bookingReference,
    tripData,
  } = useLocalSearchParams<{
    bookingId: string;
    amount: string;
    bookingReference: string;
    tripData?: string;
  }>();

  const router = useRouter();

  // Use FIXED mock payment hook
  const { initPaymentSheet, presentPaymentSheet, loading: mockLoading } = useMockPaymentSheet();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);

  // Parse trip data if available
  const tripInfo = tripData ? JSON.parse(tripData) : null;

  // Fetch booking details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (bookingId) {
          const bookingResponse = await getBookingById(bookingId);
          if (bookingResponse.success && bookingResponse.data) {
            setBooking(bookingResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching booking data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  // Initialize FIXED Mock Payment Sheet
  useEffect(() => {
    const initializePayment = async () => {
      if (paymentInitialized) return;

      try {
        console.log('🎭 Initializing FIXED mock payment sheet...');

        // Create mock client secret
        const mockClientSecret = `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;

        const { error } = await initPaymentSheet({
          merchantDisplayName: 'Louagi',
          paymentIntentClientSecret: mockClientSecret,
          defaultBillingDetails: {
            name: 'Test Customer',
          },
          allowsDelayedPaymentMethods: false,
          returnURL: 'louagi://payment-success',
        });

        if (error) {
          console.error('❌ Mock payment sheet initialization error:', error);
          Alert.alert('Mock Payment Error', error.message || 'Failed to initialize mock payment');
          return;
        }

        setPaymentInitialized(true);
        console.log('✅ FIXED mock payment sheet initialized successfully');

      } catch (error: any) {
        console.error('❌ Mock payment initialization failed:', error);
        Alert.alert('Mock Payment Error', 'Failed to setup mock payment. Please try again.');
      }
    };

    initializePayment();
  }, [paymentInitialized, initPaymentSheet]);

  // Handle mock payment process
  const handlePayment = async () => {
    if (!paymentInitialized) {
      Alert.alert('Mock Payment Error', 'Mock payment not ready. Please wait a moment and try again.');
      return;
    }

    try {
      setProcessing(true);

      console.log('🎭 Starting FIXED mock payment process...');
      const { error } = await presentPaymentSheet();

      if (error) {
        console.log('❌ Mock payment error:', error);

        if (error.code === 'Canceled') {
          // User cancelled payment
          Alert.alert('Mock Payment Cancelled', 'You can complete mock payment later from "My Bookings".');
          return;
        }

        // Payment failed
        Alert.alert(
          'Mock Payment Failed',
          `${error.message}\n\n🎭 This is a test environment - try again with a different mock card!`,
          [
            { text: 'Try Again', onPress: () => handlePayment() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Payment completed successfully
      console.log('✅ FIXED mock payment completed successfully!');

      Alert.alert(
        '🎭 Mock Payment Successful! ✅',
        `Your mock payment has been processed successfully.\n\nBooking Reference: ${bookingReference}\nAmount: $${amount}\n\n⚠️ This was a test payment - no real money was charged!`,
        [
          {
            text: 'View Booking',
            onPress: () => router.replace({
              pathname: '/(passenger)/bookings/[id]',
              params: {
                id: bookingId,
                bookingData: booking ? JSON.stringify(booking) : undefined
              }
            })
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Unexpected mock payment error:', error);

      Alert.alert(
        'Mock Payment Error',
        `An unexpected error occurred: ${error.message || 'Unknown error'}\n\n🎭 This is a test environment.`,
        [
          { text: 'Try Again', onPress: () => handlePayment() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle skip payment
  const handleSkipPayment = () => {
    Alert.alert(
      'Skip Mock Payment?',
      'You can complete mock payment later from "My Bookings". Your seat will be reserved temporarily.',
      [
        {
          text: 'Complete Mock Payment Now',
          style: 'default',
          onPress: () => handlePayment(),
        },
        {
          text: 'Skip for Now',
          style: 'cancel',
          onPress: () => router.replace({
            pathname: '/(passenger)/bookings/[id]',
            params: {
              id: bookingId,
              bookingData: booking ? JSON.stringify(booking) : undefined
            }
          }),
        },
      ]
    );
  };

  // Show test card info
  const showTestCardInfo = () => {
    const cardInfo = MOCK_CARDS.map(card =>
      `${card.success ? '✅' : '❌'} ${card.brand} •••• ${card.last4} - ${card.description}`
    ).join('\n');

    Alert.alert(
      '💳 Available Test Cards',
      `Use these mock cards for testing:\n\n${cardInfo}\n\n🎭 No real money will be charged!`,
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#ff9800" />
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    );
  }

  // Error state - booking not found
  if (!booking && !tripInfo) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>Booking information not available</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.back()}>
          <Text style={styles.actionButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use booking data or trip data for display
  const displayData = booking || tripInfo;
  const trip = displayData?.trip || tripInfo;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <MaterialIcons name="arrow-back" size={24} color="#ff9800" />
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Complete Mock Payment</Text>

        {/* Mock payment indicator */}
        <View style={styles.mockIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.mockText}>Mock</Text>
        </View>
      </View>

      {/* Mock Payment Status */}
      <View style={styles.mockPaymentStatus}>
        <MaterialIcons name="info" size={48} color="#ff9800" />
        <Text style={styles.statusTitle}>🎭 Mock Payment Ready</Text>
        <Text style={styles.statusText}>
          Your booking has been created successfully!
        </Text>
        <Text style={styles.statusSubtext}>
          Complete your mock payment to confirm your trip booking. This is a test environment - no real money will be charged.
        </Text>
      </View>

      {/* Mock Payment Method Card */}
      <View style={styles.paymentMethodCard}>
        <View style={styles.paymentMethodHeader}>
          <MaterialIcons name="credit-card" size={24} color="#ff9800" />
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodName}>Test Credit/Debit Cards</Text>
            <Text style={styles.paymentMethodDesc}>Simulated Visa, MasterCard, Amex</Text>
          </View>
          <MaterialIcons name="check-circle" size={20} color="#ff9800" />
        </View>
      </View>

      {/* Available Test Cards */}
      <View style={styles.testCardsSection}>
        <View style={styles.testCardsHeader}>
          <Text style={styles.testCardsTitle}>🎭 Available Test Cards:</Text>
          <TouchableOpacity onPress={showTestCardInfo} style={styles.infoButton}>
            <MaterialIcons name="info-outline" size={20} color="#ff9800" />
          </TouchableOpacity>
        </View>

        {MOCK_CARDS.map((card, index) => (
          <View key={card.id} style={styles.testCard}>
            <Text style={[styles.testCardText, { color: card.success ? '#28a745' : '#dc3545' }]}>
              {card.success ? '✅' : '❌'} {card.brand} •••• {card.last4} - {card.description}
            </Text>
          </View>
        ))}
      </View>

      {/* Booking Summary */}
      <View style={styles.bookingSummary}>
        <Text style={styles.summaryTitle}>Booking Summary</Text>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Reference</Text>
          <Text style={styles.summaryValue}>#{bookingReference}</Text>
        </View>

        {trip && (
          <>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Route</Text>
              <Text style={styles.summaryValue}>{trip.route?.description || 'Trip Route'}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>From → To</Text>
              <Text style={styles.summaryValue}>
                {trip.route?.startStation?.name || 'Departure'} → {trip.route?.endStation?.name || 'Destination'}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Departure</Text>
              <Text style={styles.summaryValue}>
                {trip.departureTime ?
                  new Date(trip.departureTime).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  }) : 'When trip is full'
                }
              </Text>
            </View>

            {trip.driver && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Driver</Text>
                <Text style={styles.summaryValue}>
                  {trip.driver.user?.username || 'Driver'} ⭐ {trip.driver.rating?.toFixed(1) || '5.0'}
                </Text>
              </View>
            )}
          </>
        )}

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Seats</Text>
          <Text style={styles.summaryValue}>{booking?.seats || '1'}</Text>
        </View>

        <View style={[styles.summaryItem, styles.totalItem]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>${amount}</Text>
        </View>
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <MaterialIcons name="security" size={20} color="#ff9800" />
        <Text style={styles.securityText}>
          🎭 This is a test environment. No real payment processing or card details are involved.
        </Text>
      </View>

      {/* Payment Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!paymentInitialized || processing || mockLoading) && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={!paymentInitialized || processing || mockLoading}
        >
          {processing || mockLoading ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.payButtonText}>
                {mockLoading ? 'Preparing...' : 'Processing...'}
              </Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <MaterialIcons name="payment" size={20} color="white" />
              <Text style={styles.payButtonText}>🎭 Mock Pay ${amount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipPayment}
          disabled={processing}
        >
          <Text style={styles.skipButtonText}>Complete Mock Payment Later</Text>
        </TouchableOpacity>
      </View>

      {/* Trip Capacity Info */}
      {trip && (
        <View style={styles.capacityInfo}>
          <MaterialIcons name="directions-car" size={20} color="#ff9800" />
          <Text style={styles.capacityTitle}>Trip Status</Text>
          <Text style={styles.capacityText}>
            Current capacity: {(trip.capacity || 4) - (trip.availableSeats || 0)}/{trip.capacity || 4} passengers
          </Text>
          <Text style={styles.capacitySubtext}>
            {trip.availableSeats || 0} seat{(trip.availableSeats || 0) !== 1 ? 's' : ''} remaining
          </Text>

          {(trip.availableSeats || 0) <= 2 && (
            <View style={styles.urgentNotice}>
              <Text style={styles.urgentText}>
                🔥 Almost full! Complete mock payment to secure your seat.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Important Information */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>🎭 After Mock Payment:</Text>
        <View style={styles.infoItem}>
          <MaterialIcons name="check-circle" size={16} color="#ff9800" />
          <Text style={styles.infoText}>Instant booking confirmation (simulated)</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="email" size={16} color="#ff9800" />
          <Text style={styles.infoText}>Test receipt generated</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="smartphone" size={16} color="#ff9800" />
          <Text style={styles.infoText}>Track trip status in "My Bookings"</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="directions-car" size={16} color="#ff9800" />
          <Text style={styles.infoText}>Driver notified of your booking</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="flash-on" size={16} color="#ff9800" />
          <Text style={styles.infoText}>Trip starts when capacity is full</Text>
        </View>
      </View>

      {/* Support */}
      <View style={styles.support}>
        <Text style={styles.supportTitle}>Need Help with Mock Payment?</Text>
        <Text style={styles.supportText}>
          This is a test environment for development purposes. Contact development team for technical support.
        </Text>
        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => Alert.alert(
            'Mock Payment Support',
            '🎭 This is a development environment:\n\n• No real payments are processed\n• All transactions are simulated\n• Use test cards provided above\n\nFor development support, contact the tech team.'
          )}
        >
          <MaterialIcons name="help-outline" size={16} color="#ff9800" />
          <Text style={styles.supportButtonText}>Mock Payment Help</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Main component with Mock Stripe Provider
export default function EnhancedPaymentScreen() {
  return (
    <MockStripeProvider publishableKey="mock_key">
      <PaymentContent />
    </MockStripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#ff9800',
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },

  // Mock payment indicator styles
  mockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff9800',
    marginRight: 4,
  },
  mockText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '600',
  },

  // Mock payment status
  mockPaymentStatus: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#856404',
    marginTop: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#856404',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    textAlign: 'center',
  },

  // Payment method card
  paymentMethodCard: {
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
  paymentMethodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ff9800',
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 2,
  },
  paymentMethodDesc: {
    fontSize: 12,
    color: '#856404',
  },

  // Test cards section
  testCardsSection: {
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
  testCardsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  testCardsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoButton: {
    padding: 4,
  },
  testCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  testCardText: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
    flex: 2,
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff9800',
  },

  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 13,
    color: '#856404',
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
    fontWeight: '500',
  },

  buttonContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  payButton: {
    backgroundColor: '#ff9800',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 56,
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  skipButtonText: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '600',
  },

  capacityInfo: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  capacityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginLeft: 8,
    marginBottom: 8,
  },
  capacityText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
  capacitySubtext: {
    fontSize: 12,
    color: '#856404',
  },
  urgentNotice: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  urgentText: {
    fontSize: 12,
    color: '#c62828',
    fontWeight: '600',
    textAlign: 'center',
  },

  infoSection: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
  },

  support: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  supportText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff9800',
  },
  supportButtonText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },

  actionButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});