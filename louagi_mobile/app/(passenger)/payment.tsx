// app/(passenger)/payment.tsx - Updated Payment Screen with Full Integration
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
import { StripeProvider, usePaymentSheet } from '@stripe/stripe-react-native';
import {
  getBookingById,
  confirmPayment,
  type Booking
} from '../../src/services/api';
import Config from '../../src/config';

// Payment Content Component
function PaymentContent() {
  const {
    bookingId,
    clientSecret,
    amount,
    bookingReference,
    tripData,
  } = useLocalSearchParams<{
    bookingId: string;
    clientSecret: string;
    amount: string;
    bookingReference: string;
    tripData?: string;
  }>();

  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet, loading: stripeLoading } = usePaymentSheet();

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

  // Initialize Payment Sheet
  useEffect(() => {
    const initializePayment = async () => {
      if (!clientSecret || paymentInitialized) return;

      try {
        console.log('💳 Initializing payment sheet with clientSecret:', clientSecret);

        const { error } = await initPaymentSheet({
          merchantDisplayName: Config.APP_NAME || 'Louagi',
          paymentIntentClientSecret: clientSecret,
          defaultBillingDetails: {
            name: 'Customer',
          },
          allowsDelayedPaymentMethods: false,
          returnURL: 'louagi://payment-success',
        });

        if (error) {
          console.error('❌ Payment sheet initialization error:', error);
          Alert.alert('Payment Error', 'Failed to initialize payment. Please try again.');
          return;
        }

        setPaymentInitialized(true);
        console.log('✅ Payment sheet initialized successfully');

      } catch (error: any) {
        console.error('❌ Payment initialization failed:', error);
        Alert.alert('Payment Error', 'Failed to setup payment. Please try again.');
      }
    };

    initializePayment();
  }, [clientSecret, paymentInitialized, initPaymentSheet]);

  // Handle payment process
  const handlePayment = async () => {
    if (!paymentInitialized) {
      Alert.alert('Payment Error', 'Payment not ready. Please wait a moment and try again.');
      return;
    }

    try {
      setProcessing(true);

      console.log('🚀 Presenting payment sheet...');
      const { error } = await presentPaymentSheet();

      if (error) {
        console.error('❌ Payment sheet error:', error);

        if (error.code === 'Canceled') {
          // User cancelled payment
          Alert.alert('Payment Cancelled', 'You can complete payment later from "My Bookings".');
          return;
        }

        throw new Error(`Payment failed: ${error.message}`);
      }

      // Payment completed successfully
      console.log('✅ Payment completed successfully!');

      Alert.alert(
        'Payment Successful! ✅',
        `Your payment has been processed successfully.\n\nBooking Reference: ${bookingReference}\nAmount Paid: $${amount}`,
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
      console.error('❌ Payment error:', error);

      Alert.alert(
        'Payment Failed',
        error.message || 'Payment could not be processed. Please try again.',
        [
          { text: 'Try Again', onPress: () => handlePayment() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle skip payment (go to bookings)
  const handleSkipPayment = () => {
    Alert.alert(
      'Skip Payment?',
      'You can complete payment later from "My Bookings". Your seat will be reserved temporarily.',
      [
        {
          text: 'Complete Payment Now',
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

  // Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
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
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.back()}
        >
          <Text style={styles.actionButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Web Platform Notice
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webNotice}>
          <MaterialIcons name="web" size={64} color="#0066cc" />
          <Text style={styles.webTitle}>🌐 Web Payment Notice</Text>
          <Text style={styles.webText}>
            For the best payment experience, please use the iOS or Android app to complete your payment.
          </Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.back()}
          >
            <Text style={styles.actionButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
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
          <MaterialIcons name="arrow-back" size={24} color="#0066cc" />
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Complete Payment</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Payment Status */}
      <View style={styles.paymentStatus}>
        <MaterialIcons name="payment" size={48} color="#0066cc" />
        <Text style={styles.statusTitle}>Ready for Payment</Text>
        <Text style={styles.statusText}>
          Your booking has been created successfully!
        </Text>
        <Text style={styles.statusSubtext}>
          Complete your payment to confirm your trip booking. Your seat is temporarily reserved.
        </Text>
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

      {/* Payment Method */}
      <View style={styles.paymentMethods}>
        <Text style={styles.paymentMethodsTitle}>Payment Method</Text>

        <View style={styles.paymentMethodCard}>
          <MaterialIcons name="credit-card" size={24} color="#0066cc" />
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodName}>Credit/Debit Card</Text>
            <Text style={styles.paymentMethodDesc}>Visa, Mastercard, American Express</Text>
          </View>
          <MaterialIcons name="check-circle" size={20} color="#28a745" />
        </View>
      </View>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <MaterialIcons name="security" size={20} color="#28a745" />
        <Text style={styles.securityText}>
          Your payment is secured with 256-bit SSL encryption. We never store your card details.
        </Text>
      </View>

      {/* Payment Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!paymentInitialized || processing) && styles.payButtonDisabled
          ]}
          onPress={handlePayment}
          disabled={!paymentInitialized || processing || stripeLoading}
        >
          {processing || stripeLoading ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.payButtonText}>
                {stripeLoading ? 'Preparing...' : 'Processing...'}
              </Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <MaterialIcons name="payment" size={20} color="white" />
              <Text style={styles.payButtonText}>
                Pay ${amount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkipPayment}
          disabled={processing}
        >
          <Text style={styles.skipButtonText}>Complete Payment Later</Text>
        </TouchableOpacity>
      </View>

      {/* Trip Capacity Info */}
      {trip && (
        <View style={styles.capacityInfo}>
          <MaterialIcons name="directions-car" size={20} color="#ffc107" />
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
                🔥 Almost full! Complete payment to secure your seat.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Important Information */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>After Payment:</Text>
        <View style={styles.infoItem}>
          <MaterialIcons name="check-circle" size={16} color="#28a745" />
          <Text style={styles.infoText}>Instant booking confirmation</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="email" size={16} color="#28a745" />
          <Text style={styles.infoText}>Email receipt sent immediately</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="smartphone" size={16} color="#28a745" />
          <Text style={styles.infoText}>Track trip status in "My Bookings"</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="directions-car" size={16} color="#28a745" />
          <Text style={styles.infoText}>Driver notified of your booking</Text>
        </View>
        <View style={styles.infoItem}>
          <MaterialIcons name="flash-on" size={16} color="#28a745" />
          <Text style={styles.infoText}>Trip starts when capacity is full</Text>
        </View>
      </View>

      {/* Support */}
      <View style={styles.support}>
        <Text style={styles.supportTitle}>Need Help?</Text>
        <Text style={styles.supportText}>
          Contact our support team at support@louagi.com or call +216 XX XXX XXX
        </Text>
        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => Alert.alert(
            'Support',
            'For immediate assistance:\n\n📧 Email: support@louagi.com\n📞 Phone: +216 XX XXX XXX\n\nSupport hours: 24/7'
          )}
        >
          <MaterialIcons name="help-outline" size={16} color="#0066cc" />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Main component with Stripe Provider
export default function EnhancedPaymentScreen() {
  return (
    <StripeProvider publishableKey={Config.STRIPE_PUBLISHABLE_KEY}>
      <PaymentContent />
    </StripeProvider>
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
    color: '#0066cc',
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
  headerSpacer: {
    width: 80,
  },
  paymentStatus: {
    backgroundColor: 'white',
    margin: 16,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
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
    color: '#0066cc',
  },
  paymentMethods: {
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
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0066cc',
  },
  paymentMethodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  paymentMethodDesc: {
    fontSize: 12,
    color: '#666',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 13,
    color: '#155724',
    flex: 1,
    marginLeft: 8,
    lineHeight: 18,
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  payButton: {
    backgroundColor: '#0066cc',
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
    borderColor: '#0066cc',
  },
  skipButtonText: {
    color: '#0066cc',
    fontSize: 16,
    fontWeight: '600',
  },
  capacityInfo: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
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
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0d47a1',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0d47a1',
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
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  supportButtonText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Web-specific styles
  webNotice: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  webTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  webText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: '#0066cc',
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