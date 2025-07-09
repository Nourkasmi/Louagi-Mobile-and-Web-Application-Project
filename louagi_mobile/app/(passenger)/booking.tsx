// app/(passenger)/booking.tsx - COMPLETE Payment Integration
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
import { StripeProvider, useStripe, usePaymentSheet } from '@stripe/stripe-react-native';
import {
  createBooking,
  createPaymentIntent,
  getTripById,
  type Trip,
  type Booking,
  type ApiResponse
} from '../../src/services/api';
import Config from '../../src/config';

interface EnhancedTrip extends Trip {
  realTimeData?: {
    lastUpdated: string;
    capacityChanges: number;
    isPopular: boolean;
    estimatedFillTime?: string;
  };
}

interface BookingState {
  step: 'selecting' | 'confirming' | 'processing' | 'payment' | 'completed' | 'failed';
  message: string;
  progress: number;
}

interface ValidationErrors {
  seats?: string;
  general?: string;
}

// Payment Component with Stripe
function PaymentBookingContent() {
  const { tripId, tripData } = useLocalSearchParams<{
    tripId: string;
    tripData: string;
  }>();

  const router = useRouter();
  const initialTrip: Trip | null = tripData ? JSON.parse(tripData) : null;
  const { initPaymentSheet, presentPaymentSheet, loading: stripeLoading } = usePaymentSheet();

  // Enhanced State Management
  const [trip, setTrip] = useState<EnhancedTrip | null>(initialTrip);
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [bookingState, setBookingState] = useState<BookingState>({
    step: 'selecting',
    message: 'Select your seats and preferences',
    progress: 0.2
  });
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [bookingAttempts, setBookingAttempts] = useState(0);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string>('');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0.2)).current;

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

      console.log('🔄 Fetching trip data for ID:', tripId);
      const response: ApiResponse<Trip> = await getTripById(tripId);

      let latestTrip: Trip | null = null;

      if (response?.success && response?.data) {
        latestTrip = response.data;
      } else if (response?.trip) {
        latestTrip = response.trip;
      } else if (response && !response.success && response.data) {
        latestTrip = response.data;
      } else if (response && typeof response === 'object' && response.id) {
        latestTrip = response as Trip;
      }

      if (latestTrip && latestTrip.id) {
        // Ensure we have all required trip properties
        const safeTrip: Trip = {
          id: latestTrip.id,
          routeId: latestTrip.routeId || '',
          scheduleId: latestTrip.scheduleId || '',
          driverId: latestTrip.driverId || '',
          queueId: latestTrip.queueId,
          route: latestTrip.route || {
            id: '',
            startId: '',
            endId: '',
            startStation: {
              id: '',
              name: 'Unknown Station',
              address: '',
              city: '',
              state: '',
              zipCode: '',
              capacity: 50,
              isActive: true,
              amenities: {}
            },
            endStation: {
              id: '',
              name: 'Unknown Destination',
              address: '',
              city: '',
              state: '',
              zipCode: '',
              capacity: 50,
              isActive: true,
              amenities: {}
            },
            distance: 0,
            basePrice: 0,
            estimatedDuration: 60,
            isActive: true,
            description: 'Trip Route'
          },
          schedule: latestTrip.schedule || {
            id: '',
            stationId: '',
            station: latestTrip.route?.startStation || {
              id: '',
              name: 'Unknown Station',
              address: '',
              city: '',
              state: '',
              zipCode: '',
              capacity: 50,
              isActive: true,
              amenities: {}
            },
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '18:00',
            isActive: true,
            maxTrips: 10,
            notes: ''
          },
          driver: latestTrip.driver || {
            id: '',
            user: {
              id: '',
              username: 'Unknown Driver',
              email: '',
              phone: '',
              role: 'driver' as const,
              isActive: true,
              createdAt: '',
              updatedAt: ''
            },
            licenseNo: '',
            licenseExpiry: '',
            experience: 5,
            rating: 5.0,
            vehicleType: 'Vehicle',
            vehicleCapacity: 4,
            isVerified: true,
            isAvailable: true,
            documents: {}
          },
          capacity: latestTrip.capacity || 4,
          availableSeats: latestTrip.availableSeats ?? 4,
          status: latestTrip.status || 'scheduled',
          departureTime: latestTrip.departureTime || '',
          estimatedArrivalTime: latestTrip.estimatedArrivalTime || '',
          actualDepartureTime: latestTrip.actualDepartureTime,
          actualArrivalTime: latestTrip.actualArrivalTime,
          basePrice: latestTrip.basePrice || 10,
          currentPrice: latestTrip.currentPrice || latestTrip.basePrice || 10,
          notes: latestTrip.notes,
          bookings: latestTrip.bookings,
          createdAt: latestTrip.createdAt || '',
          updatedAt: latestTrip.updatedAt || ''
        };

        // Calculate capacity changes
        const previousSeats = trip?.availableSeats || safeTrip.availableSeats;
        const capacityChange = Math.abs(safeTrip.availableSeats - previousSeats);

        // Enhanced trip with real-time data
        const enhancedTrip: EnhancedTrip = {
          ...safeTrip,
          realTimeData: {
            lastUpdated: new Date().toISOString(),
            capacityChanges: capacityChange,
            isPopular: safeTrip.capacity - safeTrip.availableSeats >= Math.ceil(safeTrip.capacity * 0.5),
            estimatedFillTime: estimateFillTime(safeTrip)
          }
        };

        setTrip(enhancedTrip);
        setLastUpdate(new Date());

        // Handle capacity changes
        if (capacityChange > 0 && !silent) {
          animateCapacityChange();
          if (Platform.OS !== 'web' && capacityChange >= 2) {
            Vibration.vibrate([50, 50, 50]);
          }
        }

        // Auto-adjust selected seats if necessary
        if (selectedSeats > safeTrip.availableSeats) {
          setSelectedSeats(Math.max(1, safeTrip.availableSeats));
          if (!silent) {
            Alert.alert(
              'Seats Adjusted',
              `Only ${safeTrip.availableSeats} seats are now available. We've adjusted your selection.`,
              [{ text: 'OK', style: 'default' }]
            );
          }
        }

        // Update booking state message
        setBookingState(prev => ({
          ...prev,
          message: getContextualMessage(safeTrip, selectedSeats)
        }));

        setValidationErrors({});

      } else {
        throw new Error('Invalid trip data received from server');
      }
    } catch (error: any) {
      console.error('❌ Error fetching trip data:', error);
      if (!silent) {
        Alert.alert('Update Failed', 'Could not refresh trip data. Please try again.');
      }
      setValidationErrors({ general: 'Failed to load latest trip data' });
    } finally {
      setRefreshing(false);
    }
  }, [tripId, trip, selectedSeats]);

  // Set up real-time polling
  useEffect(() => {
    if (!isRealTimeEnabled || !tripId) return;

    if (!trip) {
      fetchLatestTripData(false);
    } else {
      fetchLatestTripData(true);
    }

    pollInterval.current = setInterval(() => {
      fetchLatestTripData(true);
    }, 15000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [fetchLatestTripData, isRealTimeEnabled, tripId]);

  // Helper functions
  const estimateFillTime = (tripData: Trip): string => {
    if (tripData.availableSeats <= 2) return '~5 minutes';
    if (tripData.availableSeats <= 4) return '~15 minutes';
    return '~30 minutes';
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

  // Validation function
  const validateBookingData = (): boolean => {
    const errors: ValidationErrors = {};

    if (!trip) {
      errors.general = 'Trip information not available';
    } else {
      if (selectedSeats > trip.availableSeats) {
        errors.seats = `Only ${trip.availableSeats} seats available`;
      }
      if (selectedSeats < 1) {
        errors.seats = 'At least 1 seat required';
      }
      if (selectedSeats > 4) {
        errors.seats = 'Maximum 4 seats per booking';
      }
      if (trip.status !== 'scheduled') {
        errors.general = 'This trip is no longer available for booking';
      }
      if (trip.departureTime && new Date(trip.departureTime) <= new Date()) {
        errors.general = 'This trip has already departed';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Initialize Payment Sheet
  const initializePaymentSheet = async (booking: Booking) => {
    try {
      console.log('💳 Initializing payment sheet for booking:', booking.id);

      const response = await createPaymentIntent(booking.id);
      console.log('💳 Payment intent response:', response);

      if (!response.success || !response.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      setPaymentClientSecret(response.clientSecret);

      const { error } = await initPaymentSheet({
        merchantDisplayName: Config.APP_NAME || 'Louagi',
        paymentIntentClientSecret: response.clientSecret,
        defaultBillingDetails: {
          name: 'Customer',
        },
        allowsDelayedPaymentMethods: false,
        returnURL: 'louagi://payment-success',
      });

      if (error) {
        console.error('❌ Payment sheet initialization error:', error);
        throw new Error(`Payment initialization failed: ${error.message}`);
      }

      console.log('✅ Payment sheet initialized successfully');
      return true;
    } catch (error: any) {
      console.error('❌ Payment sheet initialization failed:', error);
      throw error;
    }
  };

  // Present Payment Sheet
  const openPaymentSheet = async () => {
    try {
      setBookingState(prev => ({
        ...prev,
        step: 'payment',
        message: 'Processing payment...',
        progress: 0.9
      }));

      const { error } = await presentPaymentSheet();

      if (error) {
        console.error('❌ Payment sheet error:', error);

        if (error.code === 'Canceled') {
          // User cancelled payment
          setBookingState(prev => ({
            ...prev,
            step: 'confirming',
            message: 'Payment cancelled. You can try again.',
            progress: 0.6
          }));
          return;
        }

        throw new Error(`Payment failed: ${error.message}`);
      }

      // Payment completed successfully
      console.log('✅ Payment completed successfully!');

      setBookingState({
        step: 'completed',
        message: 'Payment successful! Booking confirmed.',
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

      // Show success alert
      Alert.alert(
        'Payment Successful! ✅',
        `Your booking has been confirmed and paid.\n\nBooking Reference: ${createdBooking?.bookingReference}\nAmount Paid: $${createdBooking?.amount}`,
        [
          {
            text: 'View Booking',
            onPress: () => router.replace({
              pathname: '/(passenger)/bookings/[id]',
              params: {
                id: createdBooking?.id,
                bookingData: JSON.stringify(createdBooking)
              }
            })
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Payment error:', error);

      setBookingState({
        step: 'failed',
        message: 'Payment failed',
        progress: 0.6
      });

      animateError();

      Alert.alert(
        'Payment Failed',
        error.message || 'Payment could not be processed. Please try again.',
        [
          { text: 'Try Again', onPress: () => openPaymentSheet() },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  // Enhanced booking creation with payment flow
  const handleBooking = async () => {
    if (!trip) {
      Alert.alert('Error', 'Trip information not available');
      return;
    }

    // Validation
    if (!validateBookingData()) {
      animateError();
      return;
    }

    // Pre-flight checks
    if (bookingAttempts >= 3) {
      Alert.alert(
        'Booking Limit Reached',
        'You have reached the maximum booking attempts for this session. Please refresh and try again.',
        [
          { text: 'Refresh', onPress: () => fetchLatestTripData(false) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    try {
      setBookingAttempts(prev => prev + 1);
      setBookingState({
        step: 'processing',
        message: 'Creating your booking...',
        progress: 0.5
      });

      // Animate progress
      Animated.timing(progressAnim, {
        toValue: 0.5,
        duration: 500,
        useNativeDriver: false,
      }).start();

      console.log('🚀 Creating booking with data:', {
        tripId: trip.id,
        seats: selectedSeats,
        specialRequests: specialRequests.trim() || undefined,
      });

      const bookingResponse: ApiResponse<Booking> = await createBooking({
        tripId: trip.id,
        seats: selectedSeats,
        specialRequests: specialRequests.trim() || undefined,
      });

      console.log('📡 Raw booking response:', bookingResponse);

      // Handle different booking response structures
      let booking: Booking | null = null;
      let wasAutoStarted = false;
      let autoConfirmedBookings = 0;

      if (bookingResponse?.success && bookingResponse?.data) {
        booking = bookingResponse.data;
        wasAutoStarted = bookingResponse.tripAutoStarted || bookingResponse.wasAutoStarted || false;
        autoConfirmedBookings = bookingResponse.autoConfirmedBookings || 0;
      } else if (bookingResponse?.booking) {
        booking = bookingResponse.booking;
        wasAutoStarted = bookingResponse.tripAutoStarted || bookingResponse.wasAutoStarted || false;
        autoConfirmedBookings = bookingResponse.autoConfirmedBookings || 0;
      } else if (bookingResponse && bookingResponse.id) {
        booking = bookingResponse as Booking;
      }

      if (!booking || !booking.id) {
        throw new Error(bookingResponse?.message || 'Failed to create booking - no booking data returned');
      }

      console.log('✅ Booking created successfully:', booking);
      setCreatedBooking(booking);

      // Update state to confirming (before payment)
      setBookingState({
        step: 'confirming',
        message: 'Booking created! Preparing payment...',
        progress: 0.6
      });

      // Check if trip was auto-started (no payment needed)
      if (wasAutoStarted) {
        setBookingState({
          step: 'completed',
          message: 'Trip starting! No payment needed.',
          progress: 1.0
        });

        Alert.alert(
          'Trip Starting! 🚀',
          `Great news! Your booking filled the last seats and the trip is starting now.\n\nBooking: ${booking.bookingReference}\nConfirmed bookings: ${autoConfirmedBookings || 1}`,
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

      // For regular bookings, initialize and show payment
      try {
        await initializePaymentSheet(booking);

        // Move to payment step
        setBookingState({
          step: 'payment',
          message: 'Ready for payment. Tap to pay.',
          progress: 0.8
        });

        // Auto-open payment sheet after a brief delay
        setTimeout(() => {
          openPaymentSheet();
        }, 500);

      } catch (paymentError: any) {
        console.error('❌ Payment initialization error:', paymentError);

        // Booking created but payment failed to initialize
        Alert.alert(
          'Booking Created Successfully! ✅',
          `Your booking has been created but payment setup failed.\n\nBooking Reference: ${booking.bookingReference}\n\nYou can complete payment later from "My Bookings".`,
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
      }

    } catch (error: any) {
      console.error('❌ Enhanced booking error:', error);

      setBookingState({
        step: 'failed',
        message: 'Booking failed',
        progress: 0.2
      });

      animateError();

      // Enhanced error handling
      let errorMessage = 'Something went wrong. Please try again.';
      let shouldRefresh = false;

      if (error.message?.includes('already departed')) {
        errorMessage = 'This trip has already departed. Please select a different trip.';
      } else if (error.message?.includes('available')) {
        errorMessage = 'Not enough seats available. The trip may have filled up.';
        shouldRefresh = true;
      } else if (error.message?.includes('already have a booking')) {
        errorMessage = 'You already have a booking for this trip. Check "My Bookings".';
      } else if (error.message?.includes('not available for booking')) {
        errorMessage = 'This trip is no longer available for booking.';
        shouldRefresh = true;
      } else if (error.response?.status === 409) {
        errorMessage = 'Booking conflict. Someone may have booked these seats first.';
        shouldRefresh = true;
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid booking data. Please check your selection.';
      }

      const alertButtons = [{ text: 'OK', style: 'default' as const }];

      if (shouldRefresh) {
        alertButtons.unshift({
          text: 'Refresh Trip',
          style: 'default' as const,
          onPress: () => fetchLatestTripData(false)
        });
      }

      Alert.alert('Booking Failed', errorMessage, alertButtons);

      // Reset state after error
      setTimeout(() => {
        if (trip) {
          setBookingState({
            step: 'selecting',
            message: getContextualMessage(trip, selectedSeats),
            progress: 0.2
          });
        }
      }, 2000);
    }
  };

  // Handle seat selection
  const handleSeatChange = useCallback((change: number) => {
    const newSeats = selectedSeats + change;
    const maxSeats = Math.min(trip?.availableSeats || 0, 4);

    if (newSeats >= 1 && newSeats <= maxSeats) {
      setSelectedSeats(newSeats);
      setBookingState(prev => ({
        ...prev,
        message: trip ? getContextualMessage(trip, newSeats) : 'Loading...'
      }));
      setValidationErrors(prev => ({ ...prev, seats: undefined }));
    } else if (newSeats > maxSeats) {
      if (Platform.OS !== 'web') {
        Vibration.vibrate(50);
      }
      setValidationErrors(prev => ({
        ...prev,
        seats: newSeats > trip?.availableSeats! ?
          `Only ${trip?.availableSeats} seats available` :
          'Maximum 4 seats per booking'
      }));
    }
  }, [selectedSeats, trip]);

  // Calculate pricing
  const calculatePricing = () => {
    if (!trip) return { pricePerSeat: 0, totalAmount: 0 };

    let totalTripPrice = 0;

    if (trip.currentPrice) {
      totalTripPrice = parseFloat(trip.currentPrice.toString());
    } else if (trip.basePrice) {
      totalTripPrice = parseFloat(trip.basePrice.toString());
    } else if (trip.route?.basePrice) {
      totalTripPrice = parseFloat(trip.route.basePrice.toString());
    } else {
      totalTripPrice = 10.0;
    }

    const pricePerSeat = totalTripPrice / (trip.capacity || 4);
    const totalAmount = pricePerSeat * selectedSeats;

    return { pricePerSeat, totalAmount, totalTripPrice };
  };

  const { pricePerSeat, totalAmount } = calculatePricing();

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

  // Error state
  if (validationErrors.general) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={64} color="#f44336" />
        <Text style={styles.errorText}>{validationErrors.general}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => fetchLatestTripData(false)}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh Trip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: '#6c757d', marginTop: 12 }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.refreshButtonText}>← Go Back</Text>
        </TouchableOpacity>
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
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
          {bookingState.step === 'payment' && 'Step 4: Payment'}
          {bookingState.step === 'completed' && 'Completed!'}
          {bookingState.step === 'failed' && 'Please Try Again'}
        </Text>
      </View>

      {/* Enhanced Trip Summary */}
      <Animated.View style={[styles.tripSummary, { opacity: fadeAnim }]}>
        <View style={styles.tripHeader}>
          <Text style={styles.routeText}>
            {trip.route.startStation?.name || 'Unknown'} → {trip.route.endStation?.name || 'Unknown'}
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
            style={[
              styles.seatButton,
              selectedSeats === 1 && styles.seatButtonDisabled
            ]}
            onPress={() => handleSeatChange(-1)}
            disabled={selectedSeats === 1 || bookingState.step === 'processing'}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <MaterialIcons
              name="remove"
              size={20}
              color={selectedSeats === 1 ? '#ccc' : '#fff'}
            />
          </TouchableOpacity>

          <View style={styles.seatDisplay}>
            <Text style={styles.seatCount}>{selectedSeats}</Text>
            <Text style={styles.seatLabel}>seat{selectedSeats > 1 ? 's' : ''}</Text>
            <Text style={styles.seatPrice}>
              ${totalAmount.toFixed(2)} total
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.seatButton,
              (selectedSeats >= Math.min(trip.availableSeats, 4) || bookingState.step === 'processing') && styles.seatButtonDisabled
            ]}
            onPress={() => handleSeatChange(1)}
            disabled={selectedSeats >= Math.min(trip.availableSeats, 4) || bookingState.step === 'processing'}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
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

        {/* Show validation error for seats */}
        {validationErrors.seats && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={16} color="#f44336" />
            <Text style={styles.errorMessage}>{validationErrors.seats}</Text>
          </View>
        )}
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

        {trip.currentPrice && (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Trip Total Price</Text>
            <Text style={styles.priceValue}>
              ${parseFloat(trip.currentPrice.toString()).toFixed(2)}
            </Text>
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Trip Capacity</Text>
          <Text style={styles.priceValue}>
            {trip.capacity} seats
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Price per seat</Text>
          <Text style={styles.priceValue}>
            ${pricePerSeat.toFixed(2)}
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
                bookingState.step === 'payment' ? '#e3f2fd' :
                  trip.availableSeats <= 2 ? '#fff3cd' : '#e3f2fd'
        }
      ]}>
        <MaterialIcons
          name={
            bookingState.step === 'failed' ? 'error' :
              bookingState.step === 'completed' ? 'check-circle' :
                bookingState.step === 'processing' ? 'hourglass-empty' :
                  bookingState.step === 'payment' ? 'payment' :
                    trip.availableSeats <= 2 ? 'warning' : 'info'
          }
          size={20}
          color={
            bookingState.step === 'failed' ? '#d32f2f' :
              bookingState.step === 'completed' ? '#2e7d32' :
                bookingState.step === 'processing' ? '#1976d2' :
                  bookingState.step === 'payment' ? '#1976d2' :
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
                    bookingState.step === 'payment' ? '#1976d2' :
                      trip.availableSeats <= 2 ? '#f57c00' : '#1976d2'
          }
        ]}>
          {bookingState.message}
        </Text>
      </View>

      {/* Enhanced Book/Pay Button */}
      {bookingState.step === 'payment' ? (
        <TouchableOpacity
          style={[styles.bookButton, styles.payButton]}
          onPress={openPaymentSheet}
          disabled={stripeLoading}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {stripeLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.bookButtonText}>Preparing Payment...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <MaterialIcons name="payment" size={20} color="white" />
              <Text style={styles.bookButtonText}>
                Pay ${totalAmount.toFixed(2)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.bookButton,
            (bookingState.step === 'processing' || trip.availableSeats === 0 || Object.keys(validationErrors).length > 0) && styles.bookButtonDisabled
          ]}
          onPress={handleBooking}
          disabled={bookingState.step === 'processing' || trip.availableSeats === 0 || Object.keys(validationErrors).length > 0}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                {trip.availableSeats === 0 ? 'Trip Full' : `Book Trip - ${totalAmount.toFixed(2)}`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Booking Success Actions */}
      {bookingState.step === 'completed' && createdBooking && (
        <View style={styles.successActions}>
          <TouchableOpacity
            style={styles.successButton}
            onPress={() => router.push({
              pathname: '/(passenger)/bookings/[id]',
              params: { id: createdBooking.id, bookingData: JSON.stringify(createdBooking) }
            })}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <MaterialIcons name="visibility" size={20} color="#0066cc" />
            <Text style={styles.successButtonText}>View Booking Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.successButton, styles.homeButton]}
            onPress={() => router.push('/(passenger)/home')}
            activeOpacity={0.7}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
          >
            <MaterialIcons name="home" size={20} color="white" />
            <Text style={[styles.successButtonText, { color: 'white' }]}>Go Home</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Enhanced Important Notes */}
      <View style={styles.notesSection}>
        <Text style={styles.notesTitle}>Important Information:</Text>
        <View style={styles.noteItem}>
          <MaterialIcons name="payment" size={16} color="#0066cc" />
          <Text style={styles.notesText}>Secure payment processing with Stripe</Text>
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
        <View style={styles.noteItem}>
          <MaterialIcons name="refresh" size={16} color="#0066cc" />
          <Text style={styles.notesText}>Real-time updates ensure accurate availability</Text>
        </View>
      </View>

      {/* Enhanced Terms */}
      <Text style={styles.termsText}>
        By booking this trip, you agree to our terms and conditions.
        Your booking will be confirmed after successful payment processing.
        Real-time updates ensure accurate availability and prevent overbooking.
      </Text>
    </ScrollView>
  );
}

// Main component with Stripe Provider
export default function EnhancedBookingScreen() {
  return (
    <StripeProvider publishableKey={Config.STRIPE_PUBLISHABLE_KEY}>
      <PaymentBookingContent />
    </StripeProvider>
  );
}

// Enhanced StyleSheet
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
  refreshButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 44,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 44,
    minWidth: 60,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffebee',
    borderRadius: 6,
  },
  errorMessage: {
    fontSize: 14,
    color: '#f44336',
    marginLeft: 8,
    flex: 1,
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
    minHeight: 56,
  },
  payButton: {
    backgroundColor: '#28a745',
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
  successActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  successButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0066cc',
    backgroundColor: 'white',
    minHeight: 48,
  },
  homeButton: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
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