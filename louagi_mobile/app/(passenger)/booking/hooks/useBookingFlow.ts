// app/(passenger)/booking/hooks/useBookingFlow.ts - FIXED Complete Booking Flow
import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, Platform, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { useTripData } from './useTripData';
import { usePaymentFlow } from './usePaymentFlow';
import { useBookingValidation } from './useBookingValidation';
import { BookingService } from '../services/bookingService';
import type { Trip, Booking, Station, Destination } from '../../../../src/services/api';

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

    // Context data for fallbacks
    contextData?: {
        stationName?: string;
        destinationName?: string;
        selectedDestination?: Destination;
    };
}

export interface BookingActions {
    refreshTripData: () => void;
    retryLoading: () => void;
    updateSeats: (seats: number) => void;
    updateSpecialRequests: (requests: string) => void;
    calculateTotalAmount: () => number;
    createBooking: () => Promise<void>;
    processPayment: () => Promise<void>;
    skipPayment: () => void;
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
    contextData: undefined,
};

export function useBookingFlow(tripId: string, initialTrip?: Trip, contextData?: any) {
    const router = useRouter();
    const [state, setState] = useState<BookingState>({
        ...initialState,
        trip: initialTrip || null,
        loading: !initialTrip,
        contextData: contextData || undefined,
    });

    const lastTripUpdateRef = useRef<string>('');
    const isCreatingBookingRef = useRef(false);
    const hasInitializedRef = useRef(false);

    console.log('🎯 useBookingFlow state:', {
        tripId,
        hasInitialTrip: !!initialTrip,
        step: state.step,
        selectedSeats: state.selectedSeats,
        hasCreatedBooking: !!state.createdBooking,
        contextData: state.contextData
    });

    // Custom hooks
    const { trip, loading, refreshing, error, refreshTrip, retryLoad } = useTripData(tripId, initialTrip);
    const { initPaymentSheet, presentPaymentSheet, loading: paymentLoading } = usePaymentFlow();
    const { validateBooking } = useBookingValidation();

    // Update state when trip data changes
    useEffect(() => {
        const tripKey = trip ? `${trip.id}-${trip.availableSeats}-${loading}-${error}` : `loading-${loading}-error-${error}`;

        if (lastTripUpdateRef.current === tripKey) {
            return;
        }

        lastTripUpdateRef.current = tripKey;
        hasInitializedRef.current = true;

        console.log('🔄 Trip data changed, updating state:', {
            hasTrip: !!trip,
            loading,
            error,
            tripId: trip?.id
        });

        setState(prev => ({
            ...prev,
            trip,
            loading,
            refreshing,
            error,
        }));
    }, [trip, loading, refreshing, error]);

    // Complete booking data with fallbacks before navigation
    const completeBookingData = useCallback((booking: Booking): Booking => {
        console.log('📊 Completing booking data with fallbacks...');

        const stationName = state.contextData?.stationName || 'Departure Station';
        const destinationName = state.contextData?.destinationName || 'Destination Station';

        const completeBooking: Booking = {
            ...booking,
            // Ensure we have the trip data
            trip: booking.trip ? {
                ...booking.trip,
                route: booking.trip.route ? {
                    ...booking.trip.route,
                    startStation: booking.trip.route.startStation?.id ? booking.trip.route.startStation : {
                        id: booking.trip.route.startId || 'temp-start',
                        name: stationName,
                        address: '123 Main Street',
                        city: 'Tunis',
                        state: 'Tunis Governorate',
                        zipCode: '1000',
                        capacity: 100,
                        isActive: true,
                        contactPhone: '+216 XX XXX XXX',
                        contactEmail: 'station@louagi.com',
                        amenities: {},
                    },
                    endStation: booking.trip.route.endStation?.id ? booking.trip.route.endStation : {
                        id: booking.trip.route.endId || 'temp-end',
                        name: destinationName,
                        address: '456 Destination Ave',
                        city: 'Sfax',
                        state: 'Sfax Governorate',
                        zipCode: '3000',
                        capacity: 100,
                        isActive: true,
                        contactPhone: '+216 XX XXX XXX',
                        contactEmail: 'destination@louagi.com',
                        amenities: {},
                    },
                    description: booking.trip.route.description || `${stationName} to ${destinationName}`,
                } : {
                    id: `temp-route-${booking.id}`,
                    startId: 'temp-start',
                    endId: 'temp-end',
                    distance: 150,
                    basePrice: parseFloat(booking.amount?.toString() || '36.00'),
                    estimatedDuration: 180,
                    isActive: true,
                    description: `${stationName} to ${destinationName}`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    startStation: {
                        id: 'temp-start',
                        name: stationName,
                        address: '123 Main Street',
                        city: 'Tunis',
                        state: 'Tunis Governorate',
                        zipCode: '1000',
                        capacity: 100,
                        isActive: true,
                        contactPhone: '+216 XX XXX XXX',
                        contactEmail: 'station@louagi.com',
                        amenities: {},
                    },
                    endStation: {
                        id: 'temp-end',
                        name: destinationName,
                        address: '456 Destination Ave',
                        city: 'Sfax',
                        state: 'Sfax Governorate',
                        zipCode: '3000',
                        capacity: 100,
                        isActive: true,
                        contactPhone: '+216 XX XXX XXX',
                        contactEmail: 'destination@louagi.com',
                        amenities: {},
                    },
                },
                driver: booking.trip.driver?.id ? booking.trip.driver : {
                    id: 'temp-driver',
                    user: {
                        id: 'temp-driver-user',
                        username: 'Ahmed Ben Salem',
                        email: 'ahmed.driver@louagi.com',
                        phone: '+216 98 765 432',
                        role: 'driver' as const,
                        isActive: true,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                    licenseNo: 'TN-123456789',
                    licenseExpiry: '2025-12-31',
                    experience: 8,
                    rating: 4.7,
                    vehicleType: '8-Seater Van',
                    vehicleCapacity: booking.trip.capacity || 8,
                    isVerified: true,
                    isAvailable: true,
                    documents: {},
                },
            } : undefined,
            // Ensure we have all required fields
            amount: booking.amount || calculateTotalAmount(),
            seats: booking.seats || state.selectedSeats,
        };

        console.log('✅ Booking data completed:', {
            hasRoute: !!completeBooking.trip?.route,
            startStationName: completeBooking.trip?.route?.startStation?.name,
            endStationName: completeBooking.trip?.route?.endStation?.name,
            driverName: completeBooking.trip?.driver?.user?.username,
            amount: completeBooking.amount,
            seats: completeBooking.seats,
        });

        return completeBooking;
    }, [state.contextData, state.selectedSeats]);

    // Calculate total amount
    const calculateTotalAmount = useCallback(() => {
        if (!state.trip) return 0;

        try {
            const tripPrice = parseFloat(state.trip.currentPrice || state.trip.basePrice || '36');
            const pricePerSeat = tripPrice / (state.trip.capacity || 4);
            const totalAmount = pricePerSeat * state.selectedSeats;
            return Math.round(totalAmount * 100) / 100;
        } catch (error) {
            console.error('❌ Error calculating price:', error);
            return state.selectedSeats * 9;
        }
    }, [state.trip?.currentPrice, state.trip?.basePrice, state.trip?.capacity, state.selectedSeats]);

    // Update seats
    const updateSeats = useCallback((seats: number) => {
        if (!state.trip || seats === state.selectedSeats) return;

        const maxSeats = Math.min(state.trip.availableSeats, 4);

        if (seats >= 1 && seats <= maxSeats) {
            setState(prev => ({
                ...prev,
                selectedSeats: seats,
                validation: { errors: {}, isValid: true },
            }));
        } else {
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
                validation: { errors: { seats: error }, isValid: false },
            }));
        }
    }, [state.trip, state.selectedSeats]);

    // Update special requests
    const updateSpecialRequests = useCallback((requests: string) => {
        if (requests === state.specialRequests) return;

        setState(prev => ({
            ...prev,
            specialRequests: requests.slice(0, 500),
        }));
    }, [state.specialRequests]);

    // Navigation actions
    const goBack = useCallback(() => router.back(), [router]);
    const goHome = useCallback(() => router.replace('/(passenger)/home'), [router]);

    const viewBookingDetails = useCallback(() => {
        if (state.createdBooking) {
            const completeBooking = completeBookingData(state.createdBooking);

            console.log('📍 Navigating to booking details with data:', {
                id: completeBooking.id,
                reference: completeBooking.bookingReference,
                hasTrip: !!completeBooking.trip,
                hasRoute: !!completeBooking.trip?.route,
            });

            router.replace({
                pathname: '/(passenger)/bookings/[id]',
                params: {
                    id: completeBooking.id,
                    bookingData: JSON.stringify(completeBooking)
                }
            });
        } else {
            console.log('⚠️ No created booking, navigating to bookings list');
            router.replace('/(passenger)/bookings');
        }
    }, [state.createdBooking, router, completeBookingData]);

    const refreshTripData = useCallback(() => refreshTrip(), [refreshTrip]);
    const retryLoading = useCallback(() => retryLoad(), [retryLoad]);

    // Create booking with proper error handling
    const createBooking = useCallback(async () => {
        if (!state.trip || isCreatingBookingRef.current) {
            console.log('❌ Cannot create booking:', { hasTrip: !!state.trip, isCreating: isCreatingBookingRef.current });
            return;
        }

        isCreatingBookingRef.current = true;

        console.log('📝 Starting booking creation:', {
            tripId: state.trip.id,
            seats: state.selectedSeats,
            step: state.step
        });

        // Validation
        const validationErrors = validateBooking({
            trip: state.trip,
            seats: state.selectedSeats,
            specialRequests: state.specialRequests,
        });

        if (validationErrors.length > 0) {
            const errors = validationErrors.reduce((acc, error) => ({ ...acc, [error.field]: error.message }), {});
            setState(prev => ({
                ...prev,
                validation: { errors, isValid: false },
            }));
            isCreatingBookingRef.current = false;
            Alert.alert('Validation Error', Object.values(errors)[0] as string);
            return;
        }

        try {
            setState(prev => ({
                ...prev,
                step: 'processing',
                progress: 0.5,
                bookingAttempts: prev.bookingAttempts + 1,
                error: null,
            }));

            const result = await BookingService.createBooking({
                tripId: state.trip.id,
                seats: state.selectedSeats,
                specialRequests: state.specialRequests.trim() || undefined,
            });

            console.log('✅ Booking created successfully:', result.booking.id);

            const { booking, wasAutoStarted, autoConfirmedBookings } = result;
            const completeBooking = completeBookingData(booking);

            if (wasAutoStarted) {
                setState(prev => ({
                    ...prev,
                    createdBooking: completeBooking,
                    step: 'completed',
                    progress: 1.0,
                    error: null,
                }));

                Alert.alert(
                    'Trip Starting! 🚀',
                    `Your booking filled the last seats and the trip is starting now.\n\nBooking: ${completeBooking.bookingReference}`,
                    [{ text: 'View Booking', onPress: viewBookingDetails }]
                );
            } else {
                setState(prev => ({
                    ...prev,
                    createdBooking: completeBooking,
                    step: 'payment',
                    progress: 0.8,
                    paymentReady: true,
                    error: null,
                }));

                console.log('💳 Booking created, proceeding to payment');

                // Initialize payment
                try {
                    await initPaymentSheet(completeBooking);
                } catch (paymentError) {
                    console.warn('⚠️ Payment initialization failed:', paymentError);
                }
            }

        } catch (error: any) {
            console.error('❌ Booking creation failed:', error);

            setState(prev => ({
                ...prev,
                step: 'failed',
                progress: 0.2,
                error: error.message || 'Booking failed',
            }));

            Alert.alert(
                'Booking Failed',
                error.message || 'Something went wrong. Please try again.',
                [{
                    text: 'OK',
                    onPress: () => {
                        setTimeout(() => {
                            setState(prev => ({
                                ...prev,
                                step: 'selecting',
                                progress: 0.2,
                                error: null,
                            }));
                        }, 1000);
                    }
                }]
            );
        } finally {
            isCreatingBookingRef.current = false;
        }
    }, [state.trip, state.selectedSeats, state.specialRequests, state.step, validateBooking, initPaymentSheet, viewBookingDetails, completeBookingData]);

    // Process payment
    const processPayment = useCallback(async () => {
        if (!state.createdBooking) {
            Alert.alert('Error', 'No booking found');
            return;
        }

        try {
            setState(prev => ({ ...prev, paymentLoading: true }));

            const { error } = await presentPaymentSheet();

            if (error) {
                if (error.code === 'Canceled') {
                    setState(prev => ({ ...prev, paymentLoading: false }));
                    Alert.alert('Payment Cancelled', 'You can complete payment later from "My Bookings".');
                    return;
                }
                throw new Error(error.message);
            }

            // Payment successful
            setState(prev => ({
                ...prev,
                step: 'completed',
                progress: 1.0,
                paymentLoading: false,
            }));

            if (Platform.OS !== 'web') {
                Vibration.vibrate([100, 50, 100]);
            }

            Alert.alert(
                '🎭 Mock Payment Successful!',
                `Booking confirmed!\nReference: ${state.createdBooking.bookingReference}\nAmount: $${calculateTotalAmount().toFixed(2)}`,
                [{ text: 'View Booking', onPress: viewBookingDetails }]
            );

        } catch (error: any) {
            setState(prev => ({ ...prev, paymentLoading: false }));
            Alert.alert(
                'Payment Failed',
                error.message,
                [
                    { text: 'Try Again', onPress: processPayment },
                    {
                        text: 'Skip', onPress: () => {
                            setState(prev => ({ ...prev, step: 'completed', progress: 1.0 }));
                            viewBookingDetails();
                        }
                    },
                ]
            );
        }
    }, [state.createdBooking, presentPaymentSheet, calculateTotalAmount, viewBookingDetails]);

    // Skip payment
    const skipPayment = useCallback(() => {
        Alert.alert(
            'Skip Payment?',
            'You can complete payment later from "My Bookings".',
            [
                { text: 'Complete Now', onPress: processPayment },
                {
                    text: 'Skip', onPress: () => {
                        setState(prev => ({ ...prev, step: 'completed', progress: 1.0 }));
                        viewBookingDetails();
                    }
                },
            ]
        );
    }, [processPayment, viewBookingDetails]);

    return {
        state,
        actions: {
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
        }
    };
}