// app/(passenger)/booking.tsx - ENHANCED with Real-time Database Integration
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
  createBooking,
  createPaymentIntent,
  getTripById,
  type Trip,
  type Booking
} from '../../src/services/api';

interface EnhancedTrip extends Trip {
  realTimeData?: {
    lastUpdated: string;
    capacityChanges: number;
    isPopular: boolean;
    estimatedFillTime?: string;
  };
}

interface BookingState {
  step: 'selecting' | 'confirming' | 'processing' | 'completed' | 'failed';
  message: string;
  progress: number;
}

export default function EnhancedPassengerBookingScreen() {
  const { tripId, tripData } = useLocalSearchParams<{
    tripId: string;
    tripData: string;
  }>();

  const router = useRouter();
  const initialTrip: Trip = tripData ? JSON.parse(tripData) : null;

  // Enhanced State Management
  const [trip, setTrip] = useState<EnhancedTrip>(initialTrip);
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingState, setBookingState] = useState<BookingState>({
    step: 'selecting',
    message: 'Select your seats and preferences',
    progress: 0.25
  });
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [bookingAttempts, setBookingAttempts] = useState(0);
  const [capacityHistory, setCapacityHistory] = useState<number[]>([]);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0.25)).current;

  // Real-time polling
  const pollInterval = useRef<NodeJS.Timeout>();

  // Enhanced trip data fetching with real-time updates
  const fetchLatestTripData = useCallback(async (silent = false) => {
    if (!tripId) return;

    try {
      if (!silent) {
        setRefreshing(true);
        setBookingState(prev => ({ ...prev, message: 'Checking latest availability...' }));
      }

      const response = await getTripById(tripId);

      if (response.success && response.data) {
        const latestTrip = response.data;

        // Calculate capacity changes
        const previousSeats = trip?.availableSeats || latestTrip.availableSeats;
        const capacityChange = Math.abs(latestTrip.availableSeats - previousSeats);

        // Enhanced trip with real-time data
        const enhancedTrip: EnhancedTrip = {
          ...latestTrip,
          realTimeData: {
            lastUpdated: new Date().toISOString(),
            capacityChanges: capacityChange,
            isPopular: latestTrip.capacity - latestTrip.availableSeats >= Math.ceil(latestTrip.capacity * 0.5),
            estimatedFillTime: estimateFillTime(latestTrip)
          }
        };

        setTrip(enhancedTrip);
        setLastUpdate(new Date());

        // Update capacity history for trends
        setCapacityHistory(prev => [...prev.slice(-9), latestTrip.availableSeats]);

        // Handle capacity changes
        if (capacityChange > 0 && !silent) {
          animateCapacityChange();

          // Haptic feedback for significant changes
          if (Platform.OS !== 'web' && capacityChange >= 2) {
            Vibration.vibrate([50, 50, 50]);
          }
        }

        // Auto-adjust selected seats if necessary
        if (selectedSeats > latestTrip.availableSeats) {
          setSelectedSeats(Math.max(1, latestTrip.availableSeats));
          if (!silent) {
            Alert.alert(
              'Seats Adjusted',
              `Only ${latestTrip.availableSeats} seats are now available. We've adjusted your selection.`,
              [{ text: 'OK', style: 'default' }]
            );
          }
        }

        // Update booking state message
        setBookingState(prev => ({
          ...prev,
          message: getContextualMessage(latestTrip, selectedSeats)
        }));

      } else {
        throw new Error('Failed to fetch trip data');
      }
    } catch (error) {
      console.error('Error fetching trip data:', error);
      if (!silent) {
        Alert.alert('Update Failed', 'Could not refresh trip data. Please try again.');
      }
    } finally {
      setRefreshing(false);
    }
  }, [tripId, trip, selectedSeats]);

  // Set up real-time polling
  useEffect(() => {
    if (!isRealTimeEnabled || !tripId) return;

    // Initial fetch
    fetchLatestTripData(true);

    // Set up polling every 10 seconds
    pollInterval.current = setInterval(() => {
      fetchLatestTripData(true);
    }, 10000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [fetchLatestTripData, isRealTimeEnabled, tripId]);

  // Helper functions
  const estimateFillTime = (tripData: Trip): string => {
    const fillRate = capacityHistory.length > 1 ?
      (capacityHistory[0] - capacityHistory[capacityHistory.length - 1]) / capacityHistory.length : 1;

    if (fillRate > 0) {
      const minutesToFill = Math.ceil(tripData.availableSeats / fillRate * 10); // 10 sec intervals
      return minutesToFill < 60 ? `~${minutesToFill} minutes` : `~${Math.ceil(minutesToFill / 60)} hours`;
    }
    return 'Unknown';
  };

  const getContextualMessage = (tripData: Trip, seats: number): string => {
    const availableSeats = tripData.availableSeats;
    const percentageFull = ((tripData.capacity - availableSeats) / tripData.capacity) * 100;

    if (availableSeats === 0) return 'Trip is now full!';
    if (availableSeats < seats) return `Only ${availableSeats} seats available`;
    if (percentageFull >= 80) return 'Almost full! Book quickly';
    if (percentageFull >= 60) return 'Filling up fast';
    return `${availableSeats} seats available`;
  };

  const animateCapacityChange = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0.7, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const animateError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  // Enhanced booking creation
  const handleBooking = async () => {
    if (!trip) {
      Alert.alert('Error', 'Trip information not available');
      return;
    }

    // Pre-flight checks
    if (bookingAttempts >= 3) {
      Alert.alert('Limit Reached', 'You have reached the maximum booking attempts. Please try again later.');
      return;
    }

    if (selectedSeats > trip.availableSeats) {
      Alert.alert('Seats Unavailable', 'Please refresh and select available seats.');
      await fetchLatestTripData();
      return;
    }

    try {
      setBookingAttempts(prev => prev + 1);
      setBookingState({
        step: 'processing',
        message: 'Creating your booking...',
        progress: 0.75
      });

      // Animate progress
      Animated.timing(progressAnim, {
        toValue: 0.75,
        duration: 500,
        useNativeDriver: false,
      }).start();

      // Create booking with enhanced error handling
      const bookingResponse = await createBooking({
        tripId: trip.id,
        seats: selectedSeats,
        specialRequests: specialRequests.trim() || undefined,
      });

      if (!bookingResponse.success || !bookingResponse.data) {
        throw new Error(bookingResponse.message || 'Failed to create booking');
      }

      const booking = bookingResponse.data;

      // Update state to completed
      setBookingState({
        step: 'completed',
        message: 'Booking created successfully!',
        progress: 1.0
      });

      // Animate completion
      Animated.timing(progressAnim, {
        toValue: 1.0,
        duration: 300,
        useNativeDriver: false,
      }).start();

      // Success haptic feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate([100, 50, 100]);
      }

      // Check if trip was auto-started
      if (bookingResponse.tripAutoStarted || bookingResponse.wasAutoStarted) {
        Alert.alert(
          'Trip Starting! 🚀',
          `Great news! Your booking filled the last seats and the trip is starting now.\n\nBooking: ${booking.bookingReference}\nConfirmed bookings: ${bookingResponse.autoConfirmedBookings || 1}`,
          [
            {
              text: 'View Booking',
              onPress: () => router.replace({
                pathname: '/(passenger)/bookings/[id]',
                params: { id: booking.id, bookingData: JSON.stringify(booking) }
              })
            }
          ]
        );
        return;
      }

      // Create payment intent
      setBookingState(prev => ({ ...prev, message: 'Preparing payment...' }));

      const paymentResponse = await createPaymentIntent(booking.id);

      if (!paymentResponse.success) {
        Alert.alert('Payment Setup Failed', 'Booking created but payment setup failed. You can complete payment later.');
        router.replace('/(passenger)/bookings');
        return;
      }

      // Navigate to payment with enhanced data
      router.push({
        pathname: '/(passenger)/payment',
        params: {
          bookingId: booking.id,
          clientSecret: paymentResponse.clientSecret || paymentResponse.data?.clientSecret,
          amount: (trip.currentPrice / trip.capacity * selectedSeats).toFixed(2),
          bookingReference: booking.bookingReference,
          tripData: JSON.stringify({
            ...trip,
            booking: booking,
            autoStarted: bookingResponse.tripAutoStarted
          })
        }
      });

    } catch (error: any) {
      console.error('Enhanced booking error:', error);

      setBookingState({
        step: 'failed',
        message: 'Booking failed',
        progress: 0.25
      });

      animateError();

      // Enhanced error handling
      let errorMessage = 'Something went wrong. Please try again.';

      if (error.message?.includes('already departed')) {
        errorMessage = 'This trip has already departed. Please select a different trip.';
      } else if (error.message?.includes('available')) {
        errorMessage = 'Not enough seats available. The trip may have filled up.';
        await fetchLatestTripData(); // Refresh data
      } else if (error.message?.includes('already have a booking')) {
        errorMessage = 'You already have a booking for this trip.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Booking conflict. Someone may have booked these seats first.';
        await fetchLatestTripData(); // Refresh data
      }

      Alert.alert('Booking Failed', errorMessage);

      // Reset state after error
      setTimeout(() => {
        setBookingState({
          step: 'selecting',
          message: getContextualMessage(trip, selectedSeats),
          progress: 0.25
        });
      }, 2000);
    }
  };

  // Handle seat selection with validation
  const handleSeatChange = (change: number) => {
    const newSeats = selectedSeats + change;
    const maxSeats = Math.min(trip?.availableSeats || 0, 4);

    if (newSeats >= 1 && newSeats <= maxSeats) {
      setSelectedSeats(newSeats);
      setBookingState(prev => ({
        ...prev,
        message: getContextualMessage(trip!, newSeats)
      }));
    } else if (newSeats > maxSeats) {
      // Provide feedback when hitting limits
      if (Platform.OS !== 'web') {
        Vibration.vibrate(50);
      }
    }
  };

  // Calculate total amount
  const totalAmount = trip ? (trip.currentPrice / trip.capacity) * selectedSeats : 0;

  // Format time displays
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'When full';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Today';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Loading state
  if (!trip) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchLatestTripData(false)}
          colors={['#0066cc']}
          title="Pull to refresh trip data"
        />
      }
    >
      {/* Enhanced Header */}
      <Animated.View style={[styles.header, { transform: [{ translateX: shakeAnim }] }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#0066cc" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Book Your Trip</Text>

        {/* Real-time indicator */}
        <View style={styles.realTimeIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isRealTimeEnabled ? '#28a745' : '#6c757d' }]} />
          <Text style={styles.realTimeText}>
            {isRealTimeEnabled ? 'Live' : 'Offline'}
          </Text>
        </View>
      </Animated.View>

      {/* Enhanced Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {bookingState.step === 'selecting' && 'Step 1: Select Seats'}
          {bookingState.step === 'confirming' && 'Step 2: Confirm Details'}
          {bookingState.step === 'processing' && 'Step 3: Processing...'}
          {bookingState.step === 'completed' && 'Completed!'}
          {bookingState.step === 'failed' && 'Please Try Again'}
        </Text>
      </View>

      {/* Enhanced Trip Summary */}
      <Animated.View style={[styles.tripSummary, { opacity: fadeAnim }]}>
        <View style={styles.tripHeader}>
          <Text style={styles.routeText}>
            {trip.route.startStation.name} → {trip.route.endStation.name}
          </Text>
          {trip.realTimeData?.isPopular && (
            <View style={styles.popularBadge}>
              <MaterialIcons name="trending-up" size={16} color="#fff" />
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
        </View>

        <Text style={styles.routeDescription}>{trip.route.description}</Text>

        {/* Enhanced Trip Details */}
        <View style={styles.tripDetails}>
          <View style={styles.timeInfo}>
            <MaterialIcons name="schedule" size={20} color="#0066cc" />
            <View style={styles.timeContent}>
              <Text style={styles.timeLabel}>Departure</Text>
              <Text style={styles.timeValue}>{formatTime(trip.departureTime)}</Text>
              <Text style={styles.dateValue}>{formatDate(trip.departureTime)}</Text>
            </View>
          </View>

          <View style={styles.durationInfo}>
            <MaterialIcons name="access-time" size={20} color="#666" />
            <View style={styles.timeContent}>
              <Text style={styles.timeLabel}>Duration</Text>
              <Text style={styles.timeValue}>{trip.route.estimatedDuration} min</Text>
            </View>
          </View>

          <View style={styles.timeInfo}>
            <MaterialIcons name="location-on" size={20} color="#28a745" />
            <View style={styles.timeContent}>
              <Text style={styles.timeLabel}>Arrival</Text>
              <Text style={styles.timeValue}>{formatTime(trip.estimatedArrivalTime)}</Text>
            </View>
          </View>
        </View>

        {/* Enhanced Driver Info */}
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitial}>
              {trip.driver?.user?.username?.charAt(0).toUpperCase() || 'D'}
            </Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>
              {trip.driver?.user?.username || 'Unknown Driver'}
            </Text>
            <View style={styles.driverMeta}>
              <MaterialIcons name="star" size={16} color="#ffc107" />
              <Text style={styles.driverRating}>
                {trip.driver?.rating?.toFixed(1) || '5.0'}
              </Text>
              <Text style={styles.driverExperience}>
                • {trip.driver?.experience || 5} years
              </Text>
            </View>
          </View>
        </View>

        {/* Enhanced Capacity Status */}
        <View style={styles.capacityStatus}>
          <View style={styles.capacityHeader}>
            <Text style={styles.capacityLabel}>Trip Capacity</Text>
            <Text style={styles.capacityCount}>
              {trip.capacity - trip.availableSeats}/{trip.capacity} booked
            </Text>
            {trip.realTimeData?.estimatedFillTime && (
              <Text style={styles.fillTimeText}>
                Est. full in: {trip.realTimeData.estimatedFillTime}
              </Text>
            )}
          </View>

          <View style={styles.capacityBar}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${((trip.capacity - trip.availableSeats) / trip.capacity) * 100}%`,
                  backgroundColor: trip.availableSeats <= 1 ? '#dc3545' :
                    trip.availableSeats <= 2 ? '#ffc107' : '#28a745'
                }
              ]}
            />
          </View>

          {/* Visual seat indicators */}
          <View style={styles.seatIndicators}>
            {Array.from({ length: trip.capacity }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.seatIndicator,
                  {
                    backgroundColor: index < (trip.capacity - trip.availableSeats)
                      ? '#0066cc' : '#e9ecef'
                  }
                ]}
              />
            ))}
          </View>

          <Text style={styles.availabilityText}>
            {trip.availableSeats} seat{trip.availableSeats !== 1 ? 's' : ''} remaining
          </Text>
        </View>

        {/* Last Update Info */}
        <View style={styles.updateInfo}>
          <MaterialIcons name="refresh" size={16} color="#666" />
          <Text style={styles.updateText}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Text>
        </View>
      </Animated.View>

      {/* Enhanced Seat Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Seats</Text>
        <View style={styles.seatSelector}>
          <TouchableOpacity
            style={[styles.seatButton, selectedSeats === 1 && styles.seatButtonDisabled]}
            onPress={() => handleSeatChange(-1)}
            disabled={selectedSeats === 1 || bookingState.step === 'processing'}
          >
            <MaterialIcons name="remove" size={20} color={selectedSeats === 1 ? '#ccc' : '#fff'} />
          </TouchableOpacity>

          <View style={styles.seatDisplay}>
            <Text style={styles.seatCount}>{selectedSeats}</Text>
            <Text style={styles.seatLabel}>seat{selectedSeats > 1 ? 's' : ''}</Text>
            <Text style={styles.seatPrice}>
              ${(totalAmount).toFixed(2)} total
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.seatButton,
              (selectedSeats >= Math.min(trip.availableSeats, 4) || bookingState.step === 'processing') && styles.seatButtonDisabled
            ]}
            onPress={() => handleSeatChange(1)}
            disabled={selectedSeats >= Math.min(trip.availableSeats, 4) || bookingState.step === 'processing'}
          >
            <MaterialIcons
              name="add"
              size={20}
              color={selectedSeats >= Math.min(trip.availableSeats, 4) ? '#ccc' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.seatLimitText}>
          Available: {trip.availableSeats} • Max per booking: 4
        </Text>
      </View>

      {/* Enhanced Special Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Any special requirements or notes..."
          value={specialRequests}
          onChangeText={setSpecialRequests}
          multiline
          numberOfLines={3}
          maxLength={500}
          editable={bookingState.step !== 'processing'}
        />
        <Text style={styles.characterCount}>
          {specialRequests.length}/500 characters
        </Text>
      </View>

      {/* Enhanced Price Summary */}
      <View style={styles.priceSummary}>
        <Text style={styles.priceSummaryTitle}>Price Summary</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Price per seat</Text>
          <Text style={styles.priceValue}>
            ${(trip.currentPrice / trip.capacity).toFixed(2)}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Seats × {selectedSeats}</Text>
          <Text style={styles.priceValue}>
            ${totalAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.priceRowTotal}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Enhanced Status Message */}
      <View style={[
        styles.statusMessage,
        {
          backgroundColor:
            bookingState.step === 'failed' ? '#ffebee' :
              bookingState.step === 'completed' ? '#e8f5e9' :
                trip.availableSeats <= 2 ? '#fff3cd' : '#e3f2fd'
        }
      ]}>
        <MaterialIcons
          name={
            bookingState.step === 'failed' ? 'error' :
              bookingState.step === 'completed' ? 'check-circle' :
                bookingState.step === 'processing' ? 'hourglass-empty' :
                  trip.availableSeats <= 2 ? 'warning' : 'info'
          }
          size={20}
          color={
            bookingState.step === 'failed' ? '#d32f2f' :
              bookingState.step === 'completed' ? '#2e7d32' :
                bookingState.step === 'processing' ? '#1976d2' :
                  trip.availableSeats <= 2 ? '#f57c00' : '#1976d2'
          }
        />
        <Text style={[
          styles.statusText,
          {
            color:
              bookingState.step === 'failed' ? '#d32f2f' :
                bookingState.step === 'completed' ? '#2e7d32' :
                  bookingState.step === 'processing' ? '#1976d2' :
                    trip.availableSeats <= 2 ? '#f57c00' : '#1976d2'
          }
        ]}>
          {bookingState.message}
        </Text>
      </View>

      {/* Enhanced Book Button */}
      <TouchableOpacity
        style={[
          styles.bookButton,
          (bookingState.step === 'processing' || trip.availableSeats === 0) && styles.bookButtonDisabled
        ]}
        onPress={handleBooking}
        disabled={bookingState.step === 'processing' || trip.availableSeats === 0}
      >
        {bookingState.step === 'processing' ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="white" size="small" />
            <Text style={styles.bookButtonText}>Processing...</Text>
          </View>
        ) : (
          <View style={styles.buttonContent}>
            <MaterialIcons
              name={trip.availableSeats === 0 ? 'block' : 'confirmation-number'}
              size={20}
              color="white"
            />
            <Text style={styles.bookButtonText}>
              {trip.availableSeats === 0 ? 'Trip Full' : `Book Trip - $${totalAmount.toFixed(2)}`}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Enhanced Important Notes */}
      <View style={styles.notesSection}>
        <Text style={styles.notesTitle}>Important Information:</Text>
        <View style={styles.noteItem}>
          <MaterialIcons name="payment" size={16} color="#0066cc" />
          <Text style={styles.notesText}>Secure payment processing after booking confirmation</Text>
        </View>
        <View style={styles.noteItem}>
          <MaterialIcons name="schedule" size={16} color="#0066cc" />
          <Text style={styles.notesText}>Cancellations allowed up to 1 hour before departure</Text>
        </View>
        <View style={styles.noteItem}>
          <MaterialIcons name="flash-on" size={16} color="#0066cc" />
          <Text style={styles.notesText}>Trip starts automatically when capacity is full</Text>
        </View>
        <View style={styles.noteItem}>
          <MaterialIcons name="email" size={16} color="#0066cc" />
          <Text style={styles.notesText}>Confirmation sent via email and SMS</Text>
        </View>
      </View>

      {/* Enhanced Terms */}
      <Text style={styles.termsText}>
        By booking this trip, you agree to our terms and conditions.
        Your booking will be confirmed after successful payment processing.
        Real-time updates ensure accurate availability.
      </Text>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  realTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  realTimeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066cc',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  tripSummary: {
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
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  timeInfo: {
    flex: 1,
    alignItems: 'center',
  },
  durationInfo: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#eee',
  },
  timeContent: {
    alignItems: 'center',
    marginTop: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
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
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverRating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  driverExperience: {
    fontSize: 14,
    color: '#666',
  },
  capacityStatus: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  capacityCount: {
    fontSize: 14,
    color: '#666',
  },
  fillTimeText: {
    fontSize: 12,
    color: '#0066cc',
    fontWeight: '500',
  },
  capacityBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 12,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 4,
  },
  seatIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  seatIndicator: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  availabilityText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  updateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  section: {
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  seatSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  seatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatButtonDisabled: {
    backgroundColor: '#ccc',
  },
  seatDisplay: {
    marginHorizontal: 40,
    alignItems: 'center',
  },
  seatCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  seatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  seatPrice: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
    marginTop: 4,
  },
  seatLimitText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  priceSummary: {
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
  priceSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  priceRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  bookButton: {
    backgroundColor: '#0066cc',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  notesSection: {
    backgroundColor: '#fff3cd',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 12,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
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