// app/(passenger)/bookings/utils/bookingUtils.ts 

import { Booking } from '../../../../src/services/api';
import { BookingStatus, BookingDisplayData } from '../types/booking.types';

export class BookingUtils {
    /**
     * Format booking data for display
     */
    static formatBookingForDisplay(booking: Booking): BookingDisplayData {
        return {
            id: booking.id,
            reference: booking.bookingReference,
            status: booking.status as BookingStatus,
            route: this.formatRoute(booking),
            date: this.formatDate(booking.trip?.departureTime || booking.createdAt),
            time: this.formatTime(booking.trip?.departureTime || booking.createdAt),
            amount: booking.amount || 0,
            seats: booking.seats,
            canCancel: this.canCancelBooking(booking),
            needsPayment: booking.status.toLowerCase() === 'pending',
            showTripInfo: !!booking.trip,
        };
    }

    /**
     * Format route string
     */
    static formatRoute(booking: Booking): string {
        const start = booking.trip?.route?.startStation?.name || 'Unknown';
        const end = booking.trip?.route?.endStation?.name || 'Unknown';
        return `${start} → ${end}`;
    }

    /**
     * Format date for display
     */
    static formatDate(dateString: string): string {
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

            // Check if it's within this week
            const daysDiff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff >= 0 && daysDiff <= 7) {
                return date.toLocaleDateString('en-US', { weekday: 'long' });
            }

            // Otherwise return formatted date
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        } catch {
            return 'Invalid Date';
        }
    }

    /**
     * Format time for display
     */
    static formatTime(dateString: string): string {
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
    }

    /**
     * Get booking status color
     */
    static getStatusColor(status: BookingStatus): string {
        const statusColors = {
            pending: '#ff9800',
            confirmed: '#4caf50',
            completed: '#2196f3',
            cancelled: '#f44336',
            no_show: '#9e9e9e',
        };

        return statusColors[status] || '#9e9e9e';
    }

    /**
     * Get booking status icon
     */
    static getStatusIcon(status: BookingStatus): string {
        const statusIcons = {
            pending: 'schedule',
            confirmed: 'check-circle',
            completed: 'done-all',
            cancelled: 'cancel',
            no_show: 'person-off',
        };

        return statusIcons[status] || 'help';
    }

    /**
     * Check if booking can be cancelled
     */
    static canCancelBooking(booking: Booking): boolean {
        const cancellableStatuses = ['pending', 'confirmed'];

        if (!cancellableStatuses.includes(booking.status.toLowerCase())) {
            return false;
        }

        // Check if trip hasn't started yet
        if (booking.trip?.departureTime) {
            const departureTime = new Date(booking.trip.departureTime);
            const now = new Date();
            const timeDiff = departureTime.getTime() - now.getTime();
            const hoursUntilDeparture = timeDiff / (1000 * 60 * 60);

            // Can cancel up to 2 hours before departure
            return hoursUntilDeparture > 2;
        }

        return true;
    }

    /**
     * Calculate refund amount
     */
    static calculateRefundAmount(booking: Booking): number {
        if (!this.canCancelBooking(booking)) {
            return 0;
        }

        const totalAmount = booking.amount || 0;

        if (booking.trip?.departureTime) {
            const departureTime = new Date(booking.trip.departureTime);
            const now = new Date();
            const timeDiff = departureTime.getTime() - now.getTime();
            const hoursUntilDeparture = timeDiff / (1000 * 60 * 60);

            if (hoursUntilDeparture > 24) {
                return totalAmount; // 100% refund
            } else if (hoursUntilDeparture > 12) {
                return totalAmount * 0.8; // 80% refund
            } else if (hoursUntilDeparture > 6) {
                return totalAmount * 0.5; // 50% refund
            } else if (hoursUntilDeparture > 2) {
                return totalAmount * 0.2; // 20% refund
            }
        }

        return 0; // No refund
    }

    /**
     * Get time until departure
     */
    static getTimeUntilDeparture(booking: Booking): {
        minutes: number;
        hours: number;
        days: number;
        text: string;
        isPast: boolean;
    } {
        if (!booking.trip?.departureTime) {
            return {
                minutes: 0,
                hours: 0,
                days: 0,
                text: 'When trip is full',
                isPast: false
            };
        }

        try {
            const departure = new Date(booking.trip.departureTime);
            const now = new Date();
            const diffMs = departure.getTime() - now.getTime();

            if (diffMs <= 0) {
                return {
                    minutes: 0,
                    hours: 0,
                    days: 0,
                    text: 'Departed',
                    isPast: true
                };
            }

            const minutes = Math.floor(diffMs / (1000 * 60));
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) {
                return {
                    minutes,
                    hours,
                    days,
                    text: `${days} day${days === 1 ? '' : 's'}`,
                    isPast: false
                };
            } else if (hours > 0) {
                return {
                    minutes,
                    hours,
                    days,
                    text: `${hours} hour${hours === 1 ? '' : 's'}`,
                    isPast: false
                };
            } else {
                return {
                    minutes,
                    hours,
                    days,
                    text: `${minutes} minute${minutes === 1 ? '' : 's'}`,
                    isPast: false
                };
            }
        } catch {
            return {
                minutes: 0,
                hours: 0,
                days: 0,
                text: 'Unknown',
                isPast: false
            };
        }
    }

    /**
     * Sort bookings by priority (pending first, then by date)
     */
    static sortBookings(bookings: Booking[]): Booking[] {
        return [...bookings].sort((a, b) => {
            // Pending bookings first
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (b.status === 'pending' && a.status !== 'pending') return 1;

            // Then by departure time (or created time)
            const dateA = new Date(a.trip?.departureTime || a.createdAt);
            const dateB = new Date(b.trip?.departureTime || b.createdAt);

            return dateB.getTime() - dateA.getTime(); // Most recent first
        });
    }

    /**
     * Filter bookings by status
     */
    static filterBookings(
        bookings: Booking[],
        filter: BookingStatus | 'all'
    ): Booking[] {
        if (filter === 'all') {
            return bookings;
        }

        return bookings.filter(booking =>
            booking.status.toLowerCase() === filter.toLowerCase()
        );
    }

    /**
     * Search bookings by text
     */
    static searchBookings(bookings: Booking[], searchText: string): Booking[] {
        if (!searchText.trim()) {
            return bookings;
        }

        const searchLower = searchText.toLowerCase();

        return bookings.filter(booking => {
            // Search in booking reference
            if (booking.bookingReference.toLowerCase().includes(searchLower)) {
                return true;
            }

            // Search in route names
            const startStation = booking.trip?.route?.startStation?.name?.toLowerCase() || '';
            const endStation = booking.trip?.route?.endStation?.name?.toLowerCase() || '';

            if (startStation.includes(searchLower) || endStation.includes(searchLower)) {
                return true;
            }

            // Search in driver name
            const driverName = booking.trip?.driver?.user?.username?.toLowerCase() || '';
            if (driverName.includes(searchLower)) {
                return true;
            }

            return false;
        });
    }

    /**
     * Get booking summary text
     */
    static getBookingSummary(booking: Booking): string {
        const route = this.formatRoute(booking);
        const date = this.formatDate(booking.trip?.departureTime || booking.createdAt);
        const seats = booking.seats;

        return `${seats} seat${seats > 1 ? 's' : ''} on ${route} • ${date}`;
    }

    /**
     * Check if booking needs attention (pending payment, about to depart, etc.)
     */
    static needsAttention(booking: Booking): {
        needs: boolean;
        reason: string;
        priority: 'low' | 'medium' | 'high';
    } {
        // Pending payment
        if (booking.status.toLowerCase() === 'pending') {
            return {
                needs: true,
                reason: 'Payment required',
                priority: 'high'
            };
        }

        // Trip departing soon
        if (booking.status.toLowerCase() === 'confirmed' && booking.trip?.departureTime) {
            const timeInfo = this.getTimeUntilDeparture(booking);

            if (timeInfo.hours <= 2 && !timeInfo.isPast) {
                return {
                    needs: true,
                    reason: `Departing in ${timeInfo.text}`,
                    priority: 'medium'
                };
            }
        }

        return {
            needs: false,
            reason: '',
            priority: 'low'
        };
    }

    /**
     * Generate booking receipt data
     */
    static generateReceiptData(booking: Booking) {
        return {
            bookingReference: booking.bookingReference,
            route: this.formatRoute(booking),
            departureDate: this.formatDate(booking.trip?.departureTime || booking.createdAt),
            departureTime: booking.trip?.departureTime ?
                this.formatTime(booking.trip.departureTime) : 'When full',
            seats: booking.seats,
            amount: booking.amount || 0,
            status: booking.status,
            driverName: booking.trip?.driver?.user?.username || 'TBD',
            vehicleInfo: booking.trip?.driver?.vehicleType || 'TBD',
            bookingDate: this.formatDate(booking.createdAt),
            specialRequests: booking.specialRequests || 'None',
        };
    }
}