// 📁 app/(passenger)/booking/hooks/useBookingFlow.ts - MAIN STATE MANAGEMENT HOOK
import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { useTripData } from './useTripData';
import { usePaymentFlow } from './usePaymentFlow';
import { useBookingValidation } from './useBookingValidation';
import { BookingService } from '../services/bookingService';
import { BookingHelpers } from '../utils/bookingHelpers';
import type { Trip, Booking } from '../../../../src/services/api';

export interface BookingState {
    // Trip data
    trip: Trip | null;
    loading: boolean;
    refreshing: boolean;
    error: string | null;

    // Form data
    selectedSeats: number;
    specialRequests: string;

    // Process state
    step: 'selecting' | 'confirming' | 'processing' | 'payment' | 'completed' | 'failed';
    progress: number;
    bookingAttempts: number;

    // Validation
    validation: {
        errors: Record<string, string>;
        isValid: boolean;
    };

    // Payment
    paymentReady: boolean;
    paymentLoading: boolean;
    paymentClientSecret?: string;

    // Results
    createdBooking?: Booking;
}

export interface BookingActions {
    // Trip actions
    refreshTripData: () => void;
    retryLoading: () => void;

    // Form actions
    updateSeats: (seats: number) => void;
    updateSpecialRequests: (requests: string) => void;
    calculateTotalAmount: () => number;

    // Booking process
    createBooking: () => Promise<void>;
    processPayment: () => Promise<void>;
    skipPayment: () => void;

    // Navigation
    goBack: () => void;
    goHome: () => void;
    viewBookingDetails: () => void;
}

const initialState: BookingState = {
    trip: null,
    loading: true,
    refreshing: false,
    error: null,
    selectedSeats: 1,
    specialRequests: '',
    step: 'selecting',
    progress: 0.2,
    bookingAttempts: 0,
    validation: { errors: {}, isValid: true },
    paymentReady: false,
    paymentLoading: false,
    createdBooking: undefined,
};

export function useBookingFlow(tripId: string, initialTrip?: Trip) {
    const router = useRouter();
    const [state, setState] = useState<BookingState>({
        ...initialState,
        trip: initialTrip || null,
        loading: !initialTrip,
    });

    // Custom hooks
    const { trip, loading, refreshing, error, refreshTrip, retryLoad } = useTripData(tripId, initialTrip);
    const { initPaymentSheet, presentPaymentSheet, loading: paymentLoading } = usePaymentFlow();
    const { validateBooking } = useBookingValidation();

    // Update state when trip data changes
    useEffect(() => {
        setState(prev => ({
            ...prev,
            trip,
            loading,
            refreshing,
            error,
        }));
    }, [trip, loading, refreshing, error]);

    // Calculate total amount
    const calculateTotalAmount = useCallback(() => {
        if (!state.trip) return 0;
        const { totalAmount } = BookingHelpers.calculatePricing(state.trip, state.selectedSeats);
        return totalAmount;
    }, [state.trip, state.selectedSeats]);

    // Update seats with validation
    const updateSeats = useCallback((seats: number) => {
        if (!state.trip) return;

        const maxSeats = Math.min(state.trip.availableSeats, 4);

        if (seats >= 1 && seats <= maxSeats) {
            setState(prev => ({
                ...prev,
                selectedSeats: seats,
                validation: { errors: {}, isValid: true },
            }));
        } else {
            // Vibration feedback for invalid selection
            if (Platform.OS !== 'web') {
                Vibration.vibrate(50);
            }

            const error = seats > state.trip.availableSeats
                ? `Only ${state.trip.availableSeats} seats available`
                : seats > 4
                    ? 'Maximum 4 seats per booking'
                    : 'At least 1 seat required';

            setState(prev => ({
                ...prev,
                validation: {
                    errors: { seats: error },
                    isValid: false
                },
            }));
        }
    }, [state.trip]);

    // Update special requests
    const updateSpecialRequests = useCallback((requests: string) => {
        setState(prev => ({
            ...prev,
            specialRequests: requests.slice(0, 500), // Max 500 characters
        }));
    }, []);

    // Navigation actions
    const goBack = useCallback(() => {
        router.back();
    }, [router]);

    const goHome = useCallback(() => {
        router.replace('/(passenger)/home');
    }, [router]);

    const viewBookingDetails = useCallback(() => {
        if (state.createdBooking) {
            router.replace({
                pathname: '/(passenger)/bookings/[id]',
                params: {
                    id: state.createdBooking.id,
                    bookingData: JSON.stringify(state.createdBooking)
                }
            });
        }
    }, [state.createdBooking, router]);

    // Refresh trip data
    const refreshTripData = useCallback(() => {
        refreshTrip();
    }, [refreshTrip]);

    // Retry loading
    const retryLoading = useCallback(() => {
        retryLoad();
    }, [retryLoad]);

    // Create booking
    const createBooking = useCallback(async () => {
        if (!state.trip) {
            Alert.alert('Error', 'Trip information not available');
            return;
        }

        // Validation
        const validationErrors = validateBooking({
            trip: state.trip,
            seats: state.selectedSeats,
            specialRequests: state.specialRequests,
        });

        if (validationErrors.length > 0) {
            setState(prev => ({
                ...prev,
                validation: {
                    errors: validationErrors.reduce((acc, error) => ({ ...acc, [error.field]: error.message }), {}),
                    isValid: false,
                }
            }));
            return;
        }

        // Check booking attempts limit
        if (state.bookingAttempts >= 3) {
            Alert.alert(
                'Booking Limit Reached',
                'You have reached the maximum booking attempts. Please refresh and try again.',
                [
                    { text: 'Refresh', onPress: refreshTripData },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
            return;
        }

        try {
            setState(prev => ({
                ...prev,
                step: 'processing',
                progress: 0.5,
                bookingAttempts: prev.bookingAttempts + 1,
            }));

            console.log('🚀 Creating booking...', {
                tripId: state.trip.id,
                seats: state.selectedSeats,
                specialRequests: state.specialRequests.trim() || undefined,
            });

            const { booking, wasAutoStarted, autoConfirmedBookings } = await BookingService.createBooking({
                tripId: state.trip.id,
                seats: state.selectedSeats,
                specialRequests: state.specialRequests.trim() || undefined,
            });

            console.log('✅ Booking created successfully:', booking);

            setState(prev => ({
                ...prev,
                createdBooking: booking,
                step: 'confirming',
                progress: 0.6,
            }));

            // Check if trip was auto-started (no payment needed)
            if (wasAutoStarted) {
                setState(prev => ({
                    ...prev,
                    step: 'completed',
                    progress: 1.0,
                }));

                Alert.alert(
                    'Trip Starting! 🚀',
                    `Great news! Your booking filled the last seats and the trip is starting now.\n\nBooking: ${booking.bookingReference}\nConfirmed bookings: ${autoConfirmedBookings}`,
                    [{ text: 'View Booking', onPress: viewBookingDetails }]
                );
                return;
            }

            // Initialize payment for regular bookings
            try {
                await initPaymentSheet(booking);
                setState(prev => ({
                    ...prev,
                    step: 'payment',
                    progress: 0.8,
                    paymentReady: true,
                }));

                // Auto-present payment sheet
                setTimeout(() => {
                    processPayment();
                }, 500);

            } catch (paymentError: any) {
                console.error('❌ Payment initialization error:', paymentError);
                Alert.alert(
                    'Booking Created Successfully! ✅',
                    `Your booking has been created but payment setup failed.\n\nBooking Reference: ${booking.bookingReference}\n\n🎭 You can complete payment later from "My Bookings".`,
                    [{ text: 'View Booking', onPress: viewBookingDetails }]
                );
            }

        } catch (error: any) {
            console.error('❌ Booking error:', error);

            setState(prev => ({
                ...prev,
                step: 'failed',
                progress: 0.2,
                error: error.message,
            }));

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
            }

            const alertButtons = [{ text: 'OK', style: 'default' as const }];
            if (shouldRefresh) {
                alertButtons.unshift({
                    text: 'Refresh Trip',
                    style: 'default' as const,
                    onPress: refreshTripData
                });
            }

            Alert.alert('Booking Failed', errorMessage, alertButtons);

            // Reset state after error
            setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    step: 'selecting',
                    progress: 0.2,
                    error: null,
                }));
            }, 2000);
        }
    }, [state.trip, state.selectedSeats, state.specialRequests, state.bookingAttempts]);

    // Process payment
    const processPayment = useCallback(async () => {
        if (!state.paymentReady || !state.createdBooking) {
            Alert.alert('Error', 'Payment not ready. Please try again.');
            return;
        }

        try {
            setState(prev => ({ ...prev, paymentLoading: true }));

            const { error } = await presentPaymentSheet();

            if (error) {
                if (error.code === 'Canceled') {
                    Alert.alert('Payment Cancelled', 'You can complete payment later from "My Bookings".');
                    return;
                }
                throw new Error(`Payment failed: ${error.message}`);
            }

            // Payment successful
            setState(prev => ({
                ...prev,
                step: 'completed',
                progress: 1.0,
                paymentLoading: false,
            }));

            // Success feedback
            if (Platform.OS !== 'web') {
                Vibration.vibrate([100, 50, 100]);
            }

            Alert.alert(
                '🎭 Mock Payment Successful! ✅',
                `Your booking has been confirmed with mock payment.\n\nBooking Reference: ${state.createdBooking.bookingReference}\nAmount: ${calculateTotalAmount()}\n\n⚠️ This was a test payment - no real money was charged!`,
                [{ text: 'View Booking', onPress: viewBookingDetails }]
            );

        } catch (error: any) {
            console.error('❌ Payment error:', error);
            setState(prev => ({ ...prev, paymentLoading: false }));

            Alert.alert(
                'Mock Payment Failed',
                `${error.message}\n\n🎭 This is just a test - try again with a different mock card!`,
                [
                    { text: 'Try Again', onPress: processPayment },
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        }
    }, [state.paymentReady, state.createdBooking, presentPaymentSheet, calculateTotalAmount]);

    // Skip payment
    const skipPayment = useCallback(() => {
        Alert.alert(
            'Skip Mock Payment?',
            'You can complete mock payment later from "My Bookings". Your seat will be reserved temporarily.',
            [
                { text: 'Complete Payment Now', onPress: processPayment },
                { text: 'Skip for Now', style: 'cancel', onPress: viewBookingDetails },
            ]
        );
    }, [processPayment, viewBookingDetails]);

    // Actions object
    const actions: BookingActions = {
        refreshTripData,
        retryLoading,
        updateSeats,
        updateSpecialRequests,
        calculateTotalAmount,
        createBooking,
        processPayment,
        skipPayment,
        goBack,
        goHome,
        viewBookingDetails,
    };

    return { state, actions };
}