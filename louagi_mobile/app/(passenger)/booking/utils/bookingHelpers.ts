// app/(passenger)/booking/utils/bookingHelpers.ts - UTILITY HELPER FUNCTIONS
import type { Trip } from '../../../../src/services/api';

/**
 * Calculate pricing for a booking
 */
export function calculatePricing(trip: Trip, seats: number) {
    const totalTripPrice = trip.currentPrice || trip.basePrice || 10;
    const pricePerSeat = totalTripPrice / trip.capacity;
    const totalAmount = pricePerSeat * seats;

    return {
        pricePerSeat: Math.round(pricePerSeat * 100) / 100, // Round to 2 decimal places
        totalAmount: Math.round(totalAmount * 100) / 100,
        totalTripPrice,
        discountAmount: 0, // Could add discount logic here
    };
}

/**
 * Format time string for display
 */
export function formatTime(dateString: string | null): string {
    if (!dateString) return 'When full';

    try {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error('Error formatting time:', error);
        return 'Invalid time';
    }
}

/**
 * Format date string for display
 */
export function formatDate(dateString: string | null): string {
    if (!dateString) return 'Today';

    try {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Check if it's today
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        }

        // Check if it's tomorrow
        if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        }

        // Otherwise return formatted date
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

/**
 * Get contextual message based on trip availability
 */
export function getContextualMessage(trip: Trip, seats: number): string {
    const availableSeats = trip.availableSeats;
    const percentageFull = ((trip.capacity - availableSeats) / trip.capacity) * 100;

    if (availableSeats === 0) {
        return 'Trip is now full!';
    }

    if (availableSeats < seats) {
        return `Only ${availableSeats} seat${availableSeats === 1 ? '' : 's'} available`;
    }

    if (percentageFull >= 90) {
        return 'Almost full! Book quickly';
    }

    if (percentageFull >= 75) {
        return 'Filling up fast';
    }

    if (percentageFull >= 50) {
        return 'More than half full';
    }

    return `${availableSeats} seat${availableSeats === 1 ? '' : 's'} available`;
}

/**
 * Calculate estimated arrival time
 */
export function calculateEstimatedArrival(departureTime: string | null, durationMinutes: number): string {
    if (!departureTime) return 'Unknown';

    try {
        const departure = new Date(departureTime);
        const arrival = new Date(departure.getTime() + (durationMinutes * 60 * 1000));

        return formatTime(arrival.toISOString());
    } catch (error) {
        console.error('Error calculating arrival time:', error);
        return 'Unknown';
    }
}

/**
 * Get trip urgency level
 */
export function getTripUrgency(trip: Trip): 'low' | 'medium' | 'high' | 'critical' {
    const availableSeats = trip.availableSeats;
    const capacity = trip.capacity;
    const percentageFull = ((capacity - availableSeats) / capacity) * 100;

    if (availableSeats === 0) return 'critical';
    if (percentageFull >= 90) return 'high';
    if (percentageFull >= 75) return 'medium';
    return 'low';
}

/**
 * Get urgency color
 */
export function getUrgencyColor(urgency: 'low' | 'medium' | 'high' | 'critical'): string {
    const colorMap = {
        low: '#4caf50',     // Green
        medium: '#ff9800',  // Orange
        high: '#f44336',    // Red
        critical: '#d32f2f' // Dark red
    };

    return colorMap[urgency];
}

/**
 * Format duration in a human-readable way
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${remainingMinutes}min`;
}

/**
 * Check if trip can be booked
 */
export function canBookTrip(trip: Trip): { canBook: boolean; reason?: string } {
    // Check trip status
    if (trip.status === 'DEPARTED') {
        return { canBook: false, reason: 'Trip has already departed' };
    }

    if (trip.status === 'CANCELED') {
        return { canBook: false, reason: 'Trip has been canceled' };
    }

    // Check availability
    if (trip.availableSeats === 0) {
        return { canBook: false, reason: 'Trip is full' };
    }

    // Check departure time
    if (trip.departureTime) {
        const departureTime = new Date(trip.departureTime);
        const now = new Date();
        const timeDiff = departureTime.getTime() - now.getTime();
        const minutesUntilDeparture = timeDiff / (1000 * 60);

        // Can't book if departure is in less than 5 minutes
        if (minutesUntilDeparture < 5) {
            return { canBook: false, reason: 'Too close to departure time' };
        }
    }

    return { canBook: true };
}

/**
 * Generate booking reference
 */
export function generateBookingReference(tripId: string, userId?: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 4);
    const tripSuffix = tripId.slice(-4);

    return `BK${tripSuffix}${timestamp}${random}`.toUpperCase();
}

/**
 * Validate seat selection
 */
export function validateSeatSelection(seats: number, trip: Trip): { isValid: boolean; error?: string } {
    if (seats < 1) {
        return { isValid: false, error: 'At least 1 seat is required' };
    }

    if (seats > 4) {
        return { isValid: false, error: 'Maximum 4 seats per booking' };
    }

    if (seats > trip.availableSeats) {
        return {
            isValid: false,
            error: `Only ${trip.availableSeats} seat${trip.availableSeats === 1 ? '' : 's'} available`
        };
    }

    return { isValid: true };
}

/**
 * Get trip status display info
 */
export function getTripStatusInfo(trip: Trip) {
    const bookedSeats = trip.capacity - trip.availableSeats;
    const percentageFull = Math.round((bookedSeats / trip.capacity) * 100);

    if (percentageFull === 100) {
        return {
            text: 'Starting Soon! 🚀',
            color: '#4caf50',
            urgent: true,
            description: 'Trip is full and ready to start'
        };
    } else if (percentageFull >= 90) {
        return {
            text: 'Almost Full!',
            color: '#ff9800',
            urgent: true,
            description: 'Only a few seats remaining'
        };
    } else if (percentageFull >= 75) {
        return {
            text: 'Filling Up',
            color: '#2196f3',
            urgent: false,
            description: 'Trip is filling up quickly'
        };
    } else if (percentageFull >= 50) {
        return {
            text: 'Available',
            color: '#4caf50',
            urgent: false,
            description: 'Good availability'
        };
    } else {
        return {
            text: 'Available',
            color: '#4caf50',
            urgent: false,
            description: 'Plenty of seats available'
        };
    }
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Calculate time until departure
 */
export function getTimeUntilDeparture(departureTime: string | null): {
    minutes: number;
    hours: number;
    days: number;
    text: string;
} {
    if (!departureTime) {
        return { minutes: 0, hours: 0, days: 0, text: 'Unknown' };
    }

    try {
        const departure = new Date(departureTime);
        const now = new Date();
        const diffMs = departure.getTime() - now.getTime();

        if (diffMs <= 0) {
            return { minutes: 0, hours: 0, days: 0, text: 'Departed' };
        }

        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return { minutes, hours, days, text: `${days} day${days === 1 ? '' : 's'}` };
        } else if (hours > 0) {
            return { minutes, hours, days, text: `${hours} hour${hours === 1 ? '' : 's'}` };
        } else {
            return { minutes, hours, days, text: `${minutes} minute${minutes === 1 ? '' : 's'}` };
        }
    } catch (error) {
        console.error('Error calculating time until departure:', error);
        return { minutes, hours, days, text: 'Unknown' };
    }
}

/**
 * Get readable trip route
 */
export function getTripRoute(trip: Trip): string {
    const startName = trip.route?.startStation?.name || 'Unknown';
    const endName = trip.route?.endStation?.name || 'Unknown';
    return `${startName} → ${endName}`;
}

/**
 * Check if booking is refundable
 */
export function isBookingRefundable(booking: any): boolean {
    const refundableStatuses = ['PENDING', 'CONFIRMED'];

    if (!refundableStatuses.includes(booking.status)) {
        return false;
    }

    // Check if trip hasn't started
    if (booking.trip?.departureTime) {
        const departureTime = new Date(booking.trip.departureTime);
        const now = new Date();
        return departureTime.getTime() > now.getTime();
    }

    return true;
}

// Create a BookingHelpers object for backward compatibility
export const BookingHelpers = {
    calculatePricing,
    formatTime,
    formatDate,
    getContextualMessage,
    calculateEstimatedArrival,
    getTripUrgency,
    getUrgencyColor,
    formatDuration,
    canBookTrip,
    generateBookingReference,
    validateSeatSelection,
    getTripStatusInfo,
    formatPrice,
    getTimeUntilDeparture,
    getTripRoute,
    isBookingRefundable,
};