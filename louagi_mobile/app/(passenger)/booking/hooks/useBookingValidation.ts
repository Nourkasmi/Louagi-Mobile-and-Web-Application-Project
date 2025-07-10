// 📁 app/(passenger)/booking/hooks/useBookingValidation.ts - VALIDATION HOOK
import { useCallback } from 'react';
import type { Trip } from '../../../../src/services/api';

export interface ValidationError {
    field: string;
    message: string;
}

export interface BookingValidationData {
    trip: Trip;
    seats: number;
    specialRequests: string;
}

export function useBookingValidation() {

    const validateSeats = useCallback((seats: number, trip: Trip): ValidationError[] => {
        const errors: ValidationError[] = [];

        if (seats < 1) {
            errors.push({
                field: 'seats',
                message: 'At least 1 seat is required'
            });
        }

        if (seats > 4) {
            errors.push({
                field: 'seats',
                message: 'Maximum 4 seats per booking'
            });
        }

        if (seats > trip.availableSeats) {
            errors.push({
                field: 'seats',
                message: `Only ${trip.availableSeats} seats available`
            });
        }

        return errors;
    }, []);

    const validateSpecialRequests = useCallback((requests: string): ValidationError[] => {
        const errors: ValidationError[] = [];

        if (requests.length > 500) {
            errors.push({
                field: 'specialRequests',
                message: 'Special requests must be 500 characters or less'
            });
        }

        // Check for inappropriate content (basic validation)
        const inappropriateWords = ['spam', 'scam', 'fake'];
        const hasInappropriateContent = inappropriateWords.some(word =>
            requests.toLowerCase().includes(word.toLowerCase())
        );

        if (hasInappropriateContent) {
            errors.push({
                field: 'specialRequests',
                message: 'Special requests contain inappropriate content'
            });
        }

        return errors;
    }, []);

    const validateTrip = useCallback((trip: Trip): ValidationError[] => {
        const errors: ValidationError[] = [];

        // Check if trip is still bookable
        if (trip.status === 'DEPARTED') {
            errors.push({
                field: 'trip',
                message: 'This trip has already departed'
            });
        }

        if (trip.status === 'CANCELED') {
            errors.push({
                field: 'trip',
                message: 'This trip has been canceled'
            });
        }

        if (trip.availableSeats === 0) {
            errors.push({
                field: 'trip',
                message: 'This trip is full'
            });
        }

        // Check if departure time is in the past (with 5 minute buffer)
        if (trip.departureTime) {
            const departureTime = new Date(trip.departureTime);
            const now = new Date();
            const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

            if (departureTime.getTime() < (now.getTime() - bufferTime)) {
                errors.push({
                    field: 'trip',
                    message: 'Cannot book trips that have already departed'
                });
            }
        }

        return errors;
    }, []);

    const validateBooking = useCallback((data: BookingValidationData): ValidationError[] => {
        const allErrors: ValidationError[] = [];

        // Validate trip
        const tripErrors = validateTrip(data.trip);
        allErrors.push(...tripErrors);

        // Only validate other fields if trip is valid
        if (tripErrors.length === 0) {
            // Validate seats
            const seatErrors = validateSeats(data.seats, data.trip);
            allErrors.push(...seatErrors);

            // Validate special requests
            const requestErrors = validateSpecialRequests(data.specialRequests);
            allErrors.push(...requestErrors);
        }

        return allErrors;
    }, [validateTrip, validateSeats, validateSpecialRequests]);

    const isValidBooking = useCallback((data: BookingValidationData): boolean => {
        const errors = validateBooking(data);
        return errors.length === 0;
    }, [validateBooking]);

    return {
        validateBooking,
        validateSeats,
        validateSpecialRequests,
        validateTrip,
        isValidBooking,
    };
}