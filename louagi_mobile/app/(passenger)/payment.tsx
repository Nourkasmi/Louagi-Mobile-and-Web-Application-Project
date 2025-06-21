// app/(tabs)/passenger/payment.tsx - Payment Processing & Confirmation
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
import { 
  getBookingById, 
  type Booking 
} from '../../../src/services/api';

export default function PassengerPaymentScreen() {
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
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

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
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingId]);

  // Handle payment confirmation
  const handlePaymentConfirmation = async () => {
    try {
      setProcessing(true);

      // In a real implementation, you would process the payment with Stripe here
      // For now, we'll simulate a successful payment
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      Alert.alert(
        'Booking Confirmed! ✅',
        `Your booking ${bookingReference} has been confirmed.\n\nReference: ${bookingReference}\nAmount: $${amount}\n\nYou will receive a confirmation email shortly.`,
        [
          {
            text: 'View My Bookings',
            onPress: () => router.replace('/(tabs)/passenger-bookings'),
          },
        ]
      );

    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Failed', 'There was an error processing your payment. Please try again.');
    } finally {
      setProcessing(false);
    }
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

  // 🌐 Web Platform - Show notice
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webNotice}>
          <Text style={styles.webTitle}>🌐 Web Payment Notice</Text>
          <Text style={styles.webText}>
            Payment processing is currently only available on mobile devices.
            Please use the iOS or Android app to complete your payment.
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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Payment</Text>
      </View>

      {/* Booking Summary */}
      <View style={styles.bookingSummary}>
        <Text style={styles.summaryTitle}>Booking Summary</Text>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Reference</Text>
          <Text style={styles.summaryValue}>#{bookingReference}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Route</Text>
          <Text style={styles.summaryValue}>{booking.trip.route.description}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>From → To</Text>
          <Text style={styles.summaryValue}>
            {booking.trip.route.startStation.name} → {booking.trip.route.endStation.name}
          </Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Departure</Text>
          <Text style={styles.summaryValue}>
            {booking.trip.departureTime ? 
              new Date(booking.trip.departureTime).toLocaleString('en-US', {
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
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Seats</Text>
          <Text style={styles.summaryValue}>{booking.seats}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Driver</Text>
          <Text style={styles.summaryValue}>
            {booking.trip.driver.user.username} ⭐ {booking.trip.driver.rating.toFixed(1)}
          </Text>
        </View>
        
        <View style={[styles.summaryItem, styles.totalItem]}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>${amount}</Text>
        </View>
      </View>

      {/* Payment Status */}
      <View style={styles.paymentStatus}>
        <Text style={styles.statusTitle}>📱 Payment Status</Text>
        <Text style={styles.statusText}>
          Your booking has been created successfully!
        </Text>
        <Text style={styles.statusSubtext}>
          Complete your payment to confirm your trip booking. Your seat will be reserved once payment is processed.
        </Text>
        
        {/* Payment Method Selection */}
        <View style={styles.paymentMethods}>
          <Text style={styles.paymentMethodsTitle}>Payment Method</Text>
          
          <TouchableOpacity style={styles.paymentMethodCard}>
            <Text style={styles.paymentMethodIcon}>💳</Text>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodName}>Credit/Debit Card</Text>
              <Text style={styles.paymentMethodDesc}>Visa, Mastercard, American Express</Text>
            </View>
            <Text style={styles.selectedIndicator}>✓</Text>
          </TouchableOpacity>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Your payment is secured with 256-bit SSL encryption. We never store your card details.
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.confirmButton, processing && styles.confirmButtonDisabled]}
          onPress={handlePaymentConfirmation}
          disabled={processing}
        >
          {processing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator color="white" />
              <Text style={styles.processingText}>Processing Payment...</Text>
            </View>
          ) : (
            <Text style={styles.confirmButtonText}>
              Pay ${amount}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Trip Capacity Info */}
      <View style={styles.capacityInfo}>
        <Text style={styles.capacityTitle}>🚗 Trip Capacity</Text>
        <Text style={styles.capacityText}>
          Current capacity: {booking.trip.capacity - booking.trip.availableSeats}/{booking.trip.capacity} passengers
        </Text>
        <Text style={styles.capacitySubtext}>
          {booking.trip.availableSeats} seat{booking.trip.availableSeats !== 1 ? 's' : ''} remaining
        </Text>
        
        {booking.trip.availableSeats <= 2 && (
          <View style={styles.urgentNotice}>
            <Text style={styles.urgentText}>
              🔥 Almost full! Book now to secure your spot.
            </Text>
          </View>
        )}
      </View>

      {/* Next Steps */}
      <View style={styles.nextSteps}>
        <Text style={styles.nextStepsTitle}>After Payment:</Text>
        <Text style={styles.nextStepsText}>• You'll receive instant booking confirmation</Text>
        <Text style={styles.nextStepsText}>• Email receipt will be sent to your registered email</Text>
        <Text style={styles.nextStepsText}>• Track your trip status in "My Bookings"</Text>
        <Text style={styles.nextStepsText}>• Driver will be notified of your booking</Text>
        <Text style={styles.nextStepsText}>• Trip starts automatically when capacity is full</Text>
      </View>

      {/* Support */}
      <View style={styles.support}>
        <Text style={styles.supportTitle}>Need Help?</Text>
        <Text style={styles.supportText}>
          Contact our support team at support@louagi.com or call +216 XX XXX XXX
        </Text>
      </View>
    </ScrollView>
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
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    marginBottom: 20,
    textAlign: 'center',
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
    marginRight: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  paymentStatus: {
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
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: '600',
    marginBottom: 8,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  paymentMethods: {
    marginBottom: 20,
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
  paymentMethodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
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
  selectedIndicator: {
    fontSize: 18,
    color: '#0066cc',
    fontWeight: 'bold',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#155724',
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  nextSteps: {
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0d47a1',
    marginBottom: 8,
  },
  nextStepsText: {
    fontSize: 14,
    color: '#0d47a1',
    marginBottom: 4,
    lineHeight: 18,
  },
  support: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  webText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});