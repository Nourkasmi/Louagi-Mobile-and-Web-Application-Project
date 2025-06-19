// app/(tabs)/passenger/payment.tsx - Fixed React Import
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
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

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
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 📱 Mobile Platforms - Show booking details
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Payment</Text>
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

      {/* Payment Status */}
      <View style={styles.paymentStatus}>
        <Text style={styles.statusTitle}>📱 Payment Status</Text>
        <Text style={styles.statusText}>
          Your booking has been created successfully!
        </Text>
        <Text style={styles.statusSubtext}>
          Stripe payment integration is in development. For now, your booking is confirmed and payment will be processed manually.
        </Text>
        
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            Alert.alert(
              'Booking Confirmed! ✅',
              `Your booking ${bookingReference} has been confirmed.\n\nReference: ${bookingReference}\nAmount: $${amount}`,
              [
                {
                  text: 'View My Bookings',
                  onPress: () => router.replace('/(tabs)/passenger/history'),
                },
              ]
            );
          }}
        >
          <Text style={styles.confirmButtonText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>

      {/* Next Steps */}
      <View style={styles.nextSteps}>
        <Text style={styles.nextStepsTitle}>Next Steps:</Text>
        <Text style={styles.nextStepsText}>• Your booking is confirmed</Text>
        <Text style={styles.nextStepsText}>• You'll receive a confirmation email</Text>
        <Text style={styles.nextStepsText}>• Check "My Bookings" for trip details</Text>
        <Text style={styles.nextStepsText}>• Payment will be processed manually</Text>
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
  confirmButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextSteps: {
    backgroundColor: '#e8f4f8',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  nextStepsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
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
});