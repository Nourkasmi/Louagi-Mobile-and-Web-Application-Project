// app/(tabs)/passenger/PaymentScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getBookingById, type Booking } from '../../../src/services/api';

// Note: For actual Stripe integration, you would need:
// npm install @stripe/stripe-react-native
// import { useStripe, CardField } from '@stripe/stripe-react-native';

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
  
  // State management
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // For demo purposes - you would use Stripe hooks here
  // const { confirmPayment } = useStripe();

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (bookingId) {
          const response = await getBookingById(bookingId);
          if (response.success && response.data) {
            setBooking(response.data);
          }
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  // Handle payment confirmation
  const handlePayment = async () => {
    if (!clientSecret) {
      Alert.alert('Error', 'Payment session expired. Please try again.');
      return;
    }

    setProcessing(true);

    try {
      // Demo payment flow - replace with actual Stripe integration
      Alert.alert(
        'Demo Payment',
        'This is a demo. In production, this would process the payment with Stripe.',
        [
          {
            text: 'Simulate Success',
            onPress: () => handlePaymentSuccess(),
          },
          {
            text: 'Simulate Failure',
            style: 'destructive',
            onPress: () => handlePaymentFailure(),
          },
        ]
      );

      /* Real Stripe integration would look like this:
      
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        type: 'Card',
        billingDetails: {
          email: 'customer@example.com',
        },
      });

      if (error) {
        Alert.alert('Payment Failed', error.message);
      } else if (paymentIntent) {
        handlePaymentSuccess();
      }
      */

    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    Alert.alert(
      'Payment Successful!',
      `Your booking ${bookingReference} has been confirmed.`,
      [
        {
          text: 'View My Bookings',
          onPress: () => {
            router.replace('/(tabs)/passenger/BookingHistoryScreen');
          },
        },
      ]
    );
  };

  // Handle failed payment
  const handlePaymentFailure = () => {
    Alert.alert(
      'Payment Failed',
      'Your payment could not be processed. Please try again or use a different payment method.',
      [
        {
          text: 'Try Again',
          onPress: () => setProcessing(false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => router.back(),
        },
      ]
    );
  };

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
          <Text style={styles.summaryLabel}>Booking Reference</Text>
          <Text style={styles.summaryValue}>#{bookingReference}</Text>
        </View>
        
        <View style={[styles.summaryItem, styles.totalItem]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>${amount}</Text>
        </View>
      </View>

      {/* Payment Method Section */}
      <View style={styles.paymentSection}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        
        {/* Demo Card Field */}
        <View style={styles.cardField}>
          <Text style={styles.cardFieldLabel}>Card Information</Text>
          <View style={styles.demoCardInput}>
            <Text style={styles.demoCardText}>
              💳 Demo Card Input
            </Text>
            <Text style={styles.demoCardSubtext}>
              In production, this would be Stripe's CardField component
            </Text>
          </View>
        </View>
        
        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <Text style={styles.infoText}>
            🔒 Your payment is secured by Stripe
          </Text>
          <Text style={styles.infoText}>
            💰 You will be charged ${amount}
          </Text>
          <Text style={styles.infoText}>
            📧 Receipt will be sent to your email
          </Text>
        </View>
      </View>

      {/* Payment Button */}
      <TouchableOpacity
        style={[styles.payButton, processing && styles.payButtonDisabled]}
        onPress={handlePayment}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.payButtonText}>
            Pay ${amount}
          </Text>
        )}
      </TouchableOpacity>

      {/* Terms */}
      <Text style={styles.termsText}>
        By completing this payment, you agree to our terms of service and privacy policy.
        Your booking will be confirmed once payment is processed.
      </Text>
    </ScrollView>
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
  paymentSection: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  cardField: {
    marginBottom: 20,
  },
  cardFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  demoCardInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  demoCardText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  demoCardSubtext: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  paymentInfo: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  payButton: {
    backgroundColor: '#0066cc',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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