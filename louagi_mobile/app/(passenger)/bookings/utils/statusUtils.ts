// app/(passenger)/bookings/utils/statusUtils.ts - Simple Status Helper Functions
import { Booking } from '../../../../src/services/api';
import { BookingStatus } from '../types/booking.types';

/**
 * 🔧 FIXED: Get the real booking status based on payment and trip status
 * This is the single source of truth for status determination
 */
export const getActualBookingStatus = (booking: Booking): BookingStatus => {
    // Priority 1: Check payment status (most accurate indicator)
    if (booking.paymentStatus === 'completed' || booking.paymentStatus === 'processing') {
        return 'confirmed';
    }

    if (booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed') {
        return 'pending';
    }

    // Priority 2: Check trip status
    if (booking.trip?.status === 'completed') {
        return 'completed';
    }

    if (booking.trip?.status === 'cancelled') {
        return 'cancelled';
    }

    // Priority 3: Normalize booking status
    const statusMap: Record<string, BookingStatus> = {
        'pending': 'pending',
        'confirmed': 'confirmed',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'canceled': 'cancelled',  // Handle both spellings
        'no_show': 'cancelled',
        'in_progress': 'confirmed',  // Treat in-progress as confirmed
    };

    return statusMap[booking.status.toLowerCase()] || 'pending';
};

/**
 * Check if booking needs payment
 */
export const needsPayment = (booking: Booking): boolean => {
    return booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed';
};

/**
 * Check if booking can be cancelled
 */
export const canCancelBooking = (booking: Booking): boolean => {
    const actualStatus = getActualBookingStatus(booking);

    if (!['pending', 'confirmed'].includes(actualStatus)) {
        return false;
    }

    // Check if trip hasn't started yet
    if (booking.trip?.departureTime) {
        const departureTime = new Date(booking.trip.departureTime);
        const now = new Date();
        return departureTime > now;
    }

    return true;
};

/**
 * Check if booking is active (not completed/cancelled)
 */
export const isActiveBooking = (booking: Booking): boolean => {
    const actualStatus = getActualBookingStatus(booking);
    return ['pending', 'confirmed'].includes(actualStatus);
};

/**
 * Get status display information
 */
export const getStatusDisplayInfo = (booking: Booking) => {
    const actualStatus = getActualBookingStatus(booking);
    const needsPaymentFlag = needsPayment(booking);

    const statusConfigs = {
        pending: {
            icon: needsPaymentFlag ? 'payment' : 'schedule',
            color: '#ff9800',
            text: needsPaymentFlag ? 'Payment Required' : 'Pending Confirmation',
            bgColor: '#fff3cd'
        },
        confirmed: {
            icon: 'check-circle',
            color: '#4caf50',
            text: 'Confirmed',
            bgColor: '#e8f5e8'
        },
        completed: {
            icon: 'done-all',
            color: '#2196f3',
            text: 'Completed',
            bgColor: '#e3f2fd'
        },
        cancelled: {
            icon: 'cancel',
            color: '#f44336',
            text: 'Cancelled',
            bgColor: '#ffebee'
        }
    };

    return statusConfigs[actualStatus] || statusConfigs.pending;
};

/**
 * 🔧 FIXED: Calculate real stats from bookings array
 */
export const calculateBookingStats = (bookings: Booking[]) => {
    const stats = {
        total: bookings.length,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
    };

    bookings.forEach(booking => {
        const actualStatus = getActualBookingStatus(booking);
        stats[actualStatus]++;
    });

    console.log('📊 Real stats calculated:', stats);
    return stats;
};

/**
 * Filter bookings by status
 */
export const filterBookingsByStatus = (bookings: Booking[], status: BookingStatus | 'all') => {
    if (status === 'all') {
        return bookings;
    }

    return bookings.filter(booking => {
        const actualStatus = getActualBookingStatus(booking);
        return actualStatus === status;
    });
};

/**
 * Sort bookings by priority
 */
export const sortBookingsByPriority = (bookings: Booking[]) => {
    return [...bookings].sort((a, b) => {
        // Priority 1: Pending payment first
        const aNeedsPayment = needsPayment(a);
        const bNeedsPayment = needsPayment(b);

        if (aNeedsPayment && !bNeedsPayment) return -1;
        if (bNeedsPayment && !aNeedsPayment) return 1;

        // Priority 2: Active bookings before completed/cancelled
        const aIsActive = isActiveBooking(a);
        const bIsActive = isActiveBooking(b);

        if (aIsActive && !bIsActive) return -1;
        if (bIsActive && !aIsActive) return 1;

        // Priority 3: Sort by departure time (or created time)
        const dateA = new Date(a.trip?.departureTime || a.createdAt);
        const dateB = new Date(b.trip?.departureTime || b.createdAt);

        return dateB.getTime() - dateA.getTime(); // Most recent first
    });
};

/**
 * Format route name from booking
 */
export const formatBookingRoute = (booking: Booking): string => {
    let startName = 'Departure';
    let endName = 'Destination';

    // Get from station names
    if (booking.trip?.route?.startStation?.name) {
        startName = booking.trip.route.startStation.name;
    }
    if (booking.trip?.route?.endStation?.name) {
        endName = booking.trip.route.endStation.name;
    }

    // Parse from route description if needed
    if ((startName === 'Departure' || endName === 'Destination') && booking.trip?.route?.description) {
        const description = booking.trip.route.description;
        const patterns = [
            /(.+?)\s*(?:to|→|-|->|–)\s*(.+)/i,
            /from\s+(.+?)\s+to\s+(.+)/i,
            /(.+?)\s*\/\s*(.+)/,
        ];

        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match && match[1] && match[2]) {
                if (startName === 'Departure') startName = match[1].trim();
                if (endName === 'Destination') endName = match[2].trim();
                break;
            }
        }
    }

    return `${startName} → ${endName}`;
};

/**
 * Format date for display
 */
export const formatBookingDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? '2-digit' : undefined
        });
    } catch {
        return 'Invalid Date';
    }
};

/**
 * Format time for display
 */
export const formatBookingTime = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return 'Invalid Time';
    }
};