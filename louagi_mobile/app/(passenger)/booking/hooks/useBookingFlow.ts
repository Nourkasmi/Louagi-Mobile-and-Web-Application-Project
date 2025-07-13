// app/(passenger)/booking/hooks/useBookingFlow.ts - SIMPLIFIED Without Payment Logic
import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, Platform, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { useTripData } from './useTripData';
import { useBookingValidation } from './useBookingValidation';
import { BookingService } from '../services/bookingService';
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
    step: 'selecting' | 'processing' | 'completed' | 'failed';
    progress: number;
    bookingAttempts: number;

    // Validation
    validation: {
        errors: Record<string, string>;
        isValid: boolean;
    };

    // Results
    createdBooking?: Booking;

    // Context data for fallbacks
    contextData?: {
        stationName?: string;
        destinationName?: string;
        selectedDestination?: any;
    };
}

export interface BookingActions {
    refreshTripData: () => void;
    retryLoading: () => void;
    updateSeats: (seats: number) => void;
    updateSpecialRequests: (requests: string) => void;
    calculateTotalAmount: () => number;
    createBooking: () => Promise<void>;
    goBack: () => void;
    goHome: () => void;
    viewBookingDetails: () => void;
    proceedToPayment: () => void;
}

const initialState: BookingState = {
    trip: null,
    loading: true,
    refreshing: false,
    error: null,
    selectedSeats: 1,
    specialRequests: '',
    step: 'selecting',
    progress: 0.25,
    bookingAttempts: 0,
    validation: { errors: {}, isValid: true },
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

    console.log('🎯 useBookingFlow state:', {
        tripId,
        hasInitialTrip: !!initialTrip,
        step: state.step,
        selectedSeats: state.selectedSeats,
        hasCreatedBooking: !!state.createdBooking,
    });

    // Custom hooks
    const { trip, loading, refreshing, error, refreshTrip, retryLoad } = useTripData(tripId, initialTrip);
    const { validateBooking } = useBookingValidation();

    // Update state when trip data changes
    useEffect(() => {
        const tripKey = trip ? `${trip.id}-${trip.availableSeats}-${loading}-${error}` : `loading-${loading}-error-${error}`;

        if (lastTripUpdateRef.current === tripKey) {
            return;
        }

        lastTripUpdateRef.current = tripKey;

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
            console.log('📍 Navigating to booking details');
            router.replace({
                pathname: '/(passenger)/bookings/[id]',
                params: {
                    id: state.createdBooking.id,
                    bookingData: JSON.stringify(state.createdBooking)
                }
            });
        } else {
            console.log('⚠️ No created booking, navigating to bookings list');
            router.replace('/(passenger)/bookings');
        }
    }, [state.createdBooking, router]);

    // Navigate to unified payment screen
    const proceedToPayment = useCallback(() => {
        if (state.createdBooking) {
            console.log('💳 Navigating to payment screen');
            router.push({
                pathname: '/(passenger)/payment',
                params: {
                    bookingId: state.createdBooking.id,
                    amount: calculateTotalAmount().toFixed(2),
                    bookingReference: state.createdBooking.bookingReference,
                    tripData: JSON.stringify(state.createdBooking), // Pass complete booking as tripData
                }
            });
        }
    }, [state.createdBooking, router, calculateTotalAmount]);

    const refreshTripData = useCallback(() => refreshTrip(), [refreshTrip]);
    const retryLoading = useCallback(() => retryLoad(), [retryLoad]);

    // Create booking - simplified without payment logic
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
                progress: 0.75,
                bookingAttempts: prev.bookingAttempts + 1,
                error: null,
            }));

            const result = await BookingService.createBooking({
                tripId: state.trip.id,
                seats: state.selectedSeats,
                specialRequests: state.specialRequests.trim() || undefined,
            });

            console.log('✅ Booking created successfully:', result.booking.id);

            const { booking, wasAutoStarted } = result;

            // Complete booking data with context fallbacks
            const completeBooking = {
                ...booking,
                trip: booking.trip ? {
                    ...booking.trip,
                    route: booking.trip.route ? {
                        ...booking.trip.route,
                        startStation: booking.trip.route.startStation || {
                            id: 'temp-start',
                            name: state.contextData?.stationName || 'Departure Station',
                            address: '123 Main Street',
                            city: 'Tunis',
                            state: 'Tunis Governorate',
                            zipCode: '1000',
                            capacity: 100,
                            isActive: true,
                            amenities: {},
                        },
                        endStation: booking.trip.route.endStation || {
                            id: 'temp-end',
                            name: state.contextData?.destinationName || 'Destination Station',
                            address: '456 Destination Ave',
                            city: 'Sfax',
                            state: 'Sfax Governorate',
                            zipCode: '3000',
                            capacity: 100,
                            isActive: true,
                            amenities: {},
                        },
                    } : undefined,
                } : undefined,
                amount: booking.amount || calculateTotalAmount(),
                seats: booking.seats || state.selectedSeats,
            };

            setState(prev => ({
                ...prev,
                createdBooking: completeBooking,
                step: 'completed',
                progress: 1.0,
                error: null,
            }));

            if (wasAutoStarted) {
                Alert.alert(
                    'Trip Starting! 🚀',
                    `Your booking filled the last seats and the trip is starting now!\n\nBooking: ${completeBooking.bookingReference}`,
                    [{ text: 'View Booking', onPress: viewBookingDetails }]
                );
            } else {
                Alert.alert(
                    'Booking Created! ✅',
                    `Your booking has been created successfully!\n\nReference: ${completeBooking.bookingReference}\n\nProceed to payment to confirm your seat.`,
                    [
                        { text: 'Pay Later', onPress: viewBookingDetails },
                        { text: 'Pay Now', onPress: proceedToPayment }
                    ]
                );
            }

        } catch (error: any) {
            console.error('❌ Booking creation failed:', error);

            setState(prev => ({
                ...prev,
                step: 'failed',
                progress: 0.25,
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
                                progress: 0.25,
                                error: null,
                            }));
                        }, 1000);
                    }
                }]
            );
        } finally {
            isCreatingBookingRef.current = false;
        }
    }, [state.trip, state.selectedSeats, state.specialRequests, state.step, state.contextData, validateBooking, calculateTotalAmount, viewBookingDetails, proceedToPayment]);

    return {
        state,
        actions: {
            refreshTripData,
            retryLoading,
            updateSeats,
            updateSpecialRequests,
            calculateTotalAmount,
            createBooking,
            goBack,
            goHome,
            viewBookingDetails,
            proceedToPayment,
        }
    };
}