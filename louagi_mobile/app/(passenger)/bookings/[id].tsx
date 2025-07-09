// app/(passenger)/bookings/[id].tsx - FIXED Booking Details Screen
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getBookingById,
  cancelBooking,
  getPaymentById,
  type Booking,
  type Payment
} from '../../../src/services/api';

export default function BookingDetailsScreen() {
  // FIXED: Safely destructure params with fallback
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const bookingData = typeof params.bookingData === 'string' ? params.bookingData : undefined;

  const router = useRouter();

  // State management
  const [booking, setBooking] = useState<Booking | null>(
    bookingData ? (() => {
      try {
        return JSON.parse(bookingData);
      } catch {
        return null;
      }
    })() : null
  );
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(!bookingData);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch booking details
  const fetchBookingDetails = async (isRefresh = false) => {
    if (!id) {
      Alert.alert('Error', 'Invalid booking ID');
      router.back();
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('Fetching booking details for ID:', id);
      const response = await getBookingById(id);

      if (response.success && response.data) {
        setBooking(response.data);

        // Fetch payment details if available
        if (response.data.paymentId) {
          try {
            const paymentResponse = await getPaymentById(response.data.paymentId);
            if (paymentResponse.success && paymentResponse.data) {
              setPayment(paymentResponse.data);
            }
          } catch (paymentError) {
            console.log('Payment details not available:', paymentError);
          }
        }
      } else {
        console.error('Failed to fetch booking:', response);
        Alert.alert('Error', 'Booking not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      Alert.alert('Error', 'Failed to load booking details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (!booking && id) {
      fetchBookingDetails();
    }
  }, [id, booking]);

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (!booking) return;

    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking for ${booking.trip.route.description}?\n\nCancellation Policy: Bookings can be cancelled up to 1 hour before departure for a full refund.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);

              const response = await cancelBooking(booking.id, 'Cancelled by passenger');

              if (response.success) {
                Alert.alert(
                  'Booking Cancelled',
                  'Your booking has been cancelled successfully. Refund will be processed within 5-7 business days.',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        fetchBookingDetails(true);
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel booking');
              }
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      fullDate: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
      shortDate: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    };
  };

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: '#ff9800', icon: '⏳', text: 'Pending Confirmation' };
      case 'confirmed':
        return { color: '#4caf50', icon: '✅', text: 'Confirmed' };
      case 'completed':
        return { color: '#2196f3', icon: '🎉', text: 'Completed' };
      case 'cancelled':
        return { color: '#f44336', icon: '❌', text: 'Cancelled' };
      case 'no_show':
        return { color: '#9e9e9e', icon: '👻', text: 'No Show' };
      default:
        return { color: '#666', icon: '❓', text: status };
    }
  };

  // Check if booking can be cancelled
  const canCancelBooking = (booking: Booking) => {
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return false;
    }

    const departureTime = new Date(booking.trip.departureTime);
    const now = new Date();
    const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursUntilDeparture > 1;
  };

  // Handle contact driver
  const handleContactDriver = () => {
    if (!booking?.trip.driver) return;

    Alert.alert(
      'Contact Driver',
      `Driver: ${booking.trip.driver.user.username}\nRating: ⭐ ${booking.trip.driver.rating.toFixed(1)}`,
      [
        {
          text: 'Call',
          onPress: () => {
            Alert.alert('Feature Coming Soon', 'Phone contact will be available soon');
          },
        },
        {
          text: 'Message',
          onPress: () => {
            Alert.alert('Feature Coming Soon', 'In-app messaging will be available soon');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Handle navigation to trip
  const handleGetDirections = () => {
    if (!booking?.trip.route) return;

    const startStation = booking.trip.route.startStation;
    const endStation = booking.trip.route.endStation;

    const url = `https://maps.google.com/maps?daddr=${endStation.address}, ${endStation.city}&saddr=${startStation.address}, ${startStation.city}`;

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Could not open maps application');
    });
  };

  // Error state - invalid params
  if (!id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Invalid booking ID</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading booking details...</Text>
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
          <Text style={styles.backButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo(booking.status);
  const { fullDate, time } = formatDateTime(booking.trip.departureTime);
  const canCancel = canCancelBooking(booking);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchBookingDetails(true)}
          colors={['#0066cc']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackButton}
        >
          <Text style={styles.headerBackText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]} />
        <View style={styles.statusContent}>
          <Text style={styles.statusText}>
            {statusInfo.icon} {statusInfo.text}
          </Text>
          <Text style={styles.bookingReference}>
            Booking #{booking.bookingReference}
          </Text>
        </View>
      </View>

      {/* Trip Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Information</Text>

        <View style={styles.tripCard}>
          <Text style={styles.routeTitle}>{booking.trip.route.description}</Text>

          <View style={styles.routeDetails}>
            <View style={styles.routePoint}>
              <Text style={styles.routeLabel}>From</Text>
              <Text style={styles.routeValue}>{booking.trip.route.startStation.name}</Text>
              <Text style={styles.routeAddress}>
                {booking.trip.route.startStation.address}, {booking.trip.route.startStation.city}
              </Text>
            </View>

            <View style={styles.routeArrow}>
              <Text style={styles.arrowText}>→</Text>
            </View>

            <View style={styles.routePoint}>
              <Text style={styles.routeLabel}>To</Text>
              <Text style={styles.routeValue}>{booking.trip.route.endStation.name}</Text>
              <Text style={styles.routeAddress}>
                {booking.trip.route.endStation.address}, {booking.trip.route.endStation.city}
              </Text>
            </View>
          </View>

          <View style={styles.tripMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{fullDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Departure</Text>
              <Text style={styles.metaValue}>{time}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Duration</Text>
              <Text style={styles.metaValue}>{booking.trip.route.estimatedDuration} min</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Booking Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Details</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seats</Text>
            <Text style={styles.detailValue}>{booking.seats}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValue}>${booking.amount}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Status</Text>
            <Text style={[
              styles.detailValue,
              { color: booking.paymentStatus === 'completed' ? '#4caf50' : '#ff9800' }
            ]}>
              {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booked On</Text>
            <Text style={styles.detailValue}>
              {new Date(booking.bookedAt || booking.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {booking.specialRequests && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Special Requests</Text>
              <Text style={styles.detailValue}>{booking.specialRequests}</Text>
            </View>
          )}

          {booking.cancellationReason && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Cancellation Reason</Text>
              <Text style={[styles.detailValue, { color: '#f44336' }]}>
                {booking.cancellationReason}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Driver Information */}
      {booking.trip.driver && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Information</Text>

          <View style={styles.driverCard}>
            <View style={styles.driverHeader}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitial}>
                  {booking.trip.driver.user.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{booking.trip.driver.user.username}</Text>
                <Text style={styles.driverRating}>
                  ⭐ {booking.trip.driver.rating.toFixed(1)} • {booking.trip.driver.experience} years
                </Text>
                <Text style={styles.driverVehicle}>
                  {booking.trip.driver.vehicleType || 'Vehicle'} • {booking.trip.driver.vehicleCapacity} seats
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.contactDriverButton}
              onPress={handleContactDriver}
            >
              <Text style={styles.contactDriverText}>Contact Driver</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Payment Information */}
      {payment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>

          <View style={styles.paymentCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <Text style={styles.detailValue}>
                {payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Paid</Text>
              <Text style={styles.detailValue}>${payment.amount}</Text>
            </View>

            {payment.processingFee && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Processing Fee</Text>
                <Text style={styles.detailValue}>${payment.processingFee}</Text>
              </View>
            )}

            {payment.paidAt && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Paid On</Text>
                <Text style={styles.detailValue}>
                  {new Date(payment.paidAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleGetDirections}
        >
          <Text style={styles.actionButtonText}>🗺️ Get Directions</Text>
        </TouchableOpacity>

        {booking.status === 'confirmed' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryAction]}
            onPress={() => {
              Alert.alert('Feature Coming Soon', 'Live trip tracking will be available soon');
            }}
          >
            <Text style={[styles.actionButtonText, styles.primaryActionText]}>
              📍 Track Trip
            </Text>
          </TouchableOpacity>
        )}

        {canCancel && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelAction]}
            onPress={handleCancelBooking}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={[styles.actionButtonText, styles.cancelActionText]}>
                ❌ Cancel Booking
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Support */}
      <View style={styles.supportSection}>
        <Text style={styles.supportTitle}>Need Help?</Text>
        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => {
            Alert.alert('Support', 'For support, please email: support@louagi.com');
          }}
        >
          <Text style={styles.supportButtonText}>💬 Contact Support</Text>
        </TouchableOpacity>
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
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerBackButton: {
    padding: 8,
  },
  headerBackText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSpacer: {
    width: 80,
  },
  statusCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicator: {
    width: 8,
    height: 60,
    borderRadius: 4,
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookingReference: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tripCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePoint: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  routeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 12,
    color: '#666',
  },
  routeArrow: {
    paddingHorizontal: 16,
  },
  arrowText: {
    fontSize: 24,
    color: '#0066cc',
    fontWeight: 'bold',
  },
  tripMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  detailsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
    flex: 1,
  },
  driverCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  driverRating: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  driverVehicle: {
    fontSize: 12,
    color: '#888',
  },
  contactDriverButton: {
    backgroundColor: '#f0f8ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  contactDriverText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  cancelAction: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  primaryActionText: {
    color: 'white',
  },
  cancelActionText: {
    color: 'white',
  },
  supportSection: {
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  supportButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066cc',
  },
  supportButtonText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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