// app/(passenger)/booking/hooks/useBookingFlow.ts 

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { createBooking, type Trip } from '../../../../src/services/api';

export interface BookingState {
    // Simplified state - no complex steps
    selectedSeats: number;
    loading: boolean;
    error: string | null;
}

export interface BookingActions {
    updateSeats: (seats: number) => void;
    calculateTotalAmount: () => number;
    bookAndPay: () => Promise<void>; // Single action: book + pay
    goBack: () => void;
}

const initialState: BookingState = {
    selectedSeats: 1,
    loading: false,
    error: null,
};

export function useBookingFlow(tripId: string, initialTrip?: Trip, contextData?: any) {
    const router = useRouter();
    const [state, setState] = useState<BookingState>(initialState);

    // Use the trip data directly (no complex loading)
    const trip = initialTrip;

    // Calculate total amount
    const calculateTotalAmount = useCallback(() => {
        if (!trip) return 0;
        const pricePerSeat = (trip.currentPrice || trip.basePrice || 36) / trip.capacity;
        return Math.round(pricePerSeat * state.selectedSeats * 100) / 100;
    }, [trip, state.selectedSeats]);

    // Update selected seats
    const updateSeats = useCallback((seats: number) => {
        if (!trip) return;

        const maxSeats = Math.min(trip.availableSeats, 4);

        if (seats >= 1 && seats <= maxSeats) {
            setState(prev => ({
                ...prev,
                selectedSeats: seats,
                error: null,
            }));
        } else {
            const error = seats > trip.availableSeats
                ? `Only ${trip.availableSeats} seats available`
                : seats > 4
                    ? 'Maximum 4 seats per booking'
                    : 'At least 1 seat required';

            setState(prev => ({ ...prev, error }));
        }
    }, [trip]);

    // Single action: Book and Pay (no separate steps)
    const bookAndPay = useCallback(async () => {
        if (!trip || state.loading) return;

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            console.log('🎯 Creating booking for immediate payment...');

            // Create booking
            const response = await createBooking({
                tripId: trip.id,
                seats: state.selectedSeats,
            });

            if (!response.success || !response.data) {
                throw new Error(response.message || 'Failed to create booking');
            }

            const booking = response.data;
            console.log('✅ Booking created:', booking.bookingReference);

            // Immediately redirect to payment - this is required
            router.push({
                pathname: '/(passenger)/payment',
                params: {
                    bookingId: booking.id,
                    amount: calculateTotalAmount().toString(),
                    bookingReference: booking.bookingReference,
                    tripData: JSON.stringify({
                        ...booking,
                        trip: trip, // Include full trip data
                    }),
                }
            });

        } catch (error: any) {
            console.error('❌ Booking failed:', error);
            setState(prev => ({
                ...prev,
                error: error.message || 'Booking failed. Please try again.'
            }));

            Alert.alert(
                'Booking Failed',
                error.message || 'Unable to create booking. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [trip, state.selectedSeats, state.loading, calculateTotalAmount, router]);

    const goBack = useCallback(() => router.back(), [router]);

    return {
        state: {
            ...state,
            trip,
            // Simplified progress (no complex steps)
            progress: state.loading ? 0.5 : 0.25,
            step: state.loading ? 'processing' : 'selecting',
        },
        actions: {
            updateSeats,
            calculateTotalAmount,
            bookAndPay, // Single action replaces all the complex flow
            goBack,
        }
    };
}