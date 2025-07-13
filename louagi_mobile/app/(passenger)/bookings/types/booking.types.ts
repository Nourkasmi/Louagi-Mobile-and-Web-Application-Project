// app/(passenger)/bookings/types/booking.types.ts - UPDATED with Real Status Handling
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type BookingAction = 'cancel' | 'retry_payment' | 'view_trip' | 'download_receipt';

// 🔧 FIXED: Real booking stats interface
export interface BookingStats {
    total: number;
    pending: number;      // Needs payment or has payment issues
    confirmed: number;    // Paid and confirmed
    completed: number;    // Trip finished
    cancelled: number;    // Cancelled bookings
}

export interface BookingFilter {
    status?: BookingStatus | 'all';
    dateRange?: {
        start: string;
        end: string;
    };
    searchText?: string;
    paymentStatus?: 'pending' | 'completed' | 'failed' | 'processing';
}

// 🔧 ENHANCED: Real booking display data with payment info
export interface BookingDisplayData {
    id: string;
    reference: string;
    status: BookingStatus;
    actualStatus: BookingStatus;  // 🔧 NEW: Real computed status
    paymentStatus: string;        // 🔧 NEW: Payment status
    route: string;
    date: string;
    time: string;
    amount: number;
    seats: number;
    canCancel: boolean;
    needsPayment: boolean;        // 🔧 FIXED: Based on payment status
    showTripInfo: boolean;
    isActive: boolean;            // 🔧 NEW: Whether booking is active
    tripCompleted: boolean;       // 🔧 NEW: Whether trip is done
}

// 🔧 NEW: Payment status types
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

// 🔧 NEW: Trip status types  
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// 🔧 NEW: Enhanced booking analytics
export interface BookingAnalytics {
    totalBookings: number;
    activeBookings: number;
    completedTrips: number;
    cancelledBookings: number;
    totalSpent: number;
    averageSpentPerTrip: number;
    successRate: number;          // completed / (completed + cancelled)
    completionRate: number;       // completed / total
    pendingPayments: number;
    onTimeTrips: number;
    mostUsedRoute: string;
    totalDistance: number;
    totalTravelTime: number;
    monthlySpending: Array<{
        month: string;
        amount: number;
        trips: number;
    }>;
    statusBreakdown: BookingStats;
}

// 🔧 NEW: Status mapping utilities
export const StatusMappings = {
    // Map backend status to display status
    bookingStatusMap: {
        'pending': 'pending',
        'confirmed': 'confirmed',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'canceled': 'cancelled',     // Handle both spellings
        'no_show': 'cancelled',
        'in_progress': 'confirmed',  // Treat in-progress as confirmed
    } as Record<string, BookingStatus>,

    // Map payment status to booking implications
    paymentStatusMap: {
        'pending': 'pending',
        'processing': 'confirmed',
        'completed': 'confirmed',
        'failed': 'pending',
        'refunded': 'cancelled',
    } as Record<string, BookingStatus>,

    // Trip status implications
    tripStatusMap: {
        'scheduled': 'confirmed',
        'in_progress': 'confirmed',
        'completed': 'completed',
        'cancelled': 'cancelled',
    } as Record<string, BookingStatus>,
};

// 🔧 NEW: Status checking utilities
export const StatusUtils = {
    /**
     * Get the real booking status based on payment and trip status
     */
    getActualStatus: (booking: {
        status: string;
        paymentStatus?: string;
        trip?: { status?: string };
    }): BookingStatus => {
        // Priority 1: Payment status (most important)
        if (booking.paymentStatus === 'completed') {
            return 'confirmed';
        }

        if (booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed') {
            return 'pending';
        }

        // Priority 2: Trip status
        if (booking.trip?.status === 'completed') {
            return 'completed';
        }

        if (booking.trip?.status === 'cancelled') {
            return 'cancelled';
        }

        // Priority 3: Booking status with normalization
        return StatusMappings.bookingStatusMap[booking.status.toLowerCase()] || 'pending';
    },

    /**
     * Check if booking needs payment
     */
    needsPayment: (booking: { paymentStatus?: string }): boolean => {
        return booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed';
    },

    /**
     * Check if booking can be cancelled
     */
    canCancel: (booking: {
        status: string;
        paymentStatus?: string;
        trip?: { departureTime?: string; status?: string };
    }): boolean => {
        const actualStatus = StatusUtils.getActualStatus(booking);

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
    },

    /**
     * Check if booking is active (not completed/cancelled)
     */
    isActive: (booking: {
        status: string;
        paymentStatus?: string;
        trip?: { status?: string };
    }): boolean => {
        const actualStatus = StatusUtils.getActualStatus(booking);
        return ['pending', 'confirmed'].includes(actualStatus);
    },

    /**
     * Get status display info
     */
    getStatusInfo: (status: BookingStatus, needsPayment: boolean = false) => {
        const statusConfigs = {
            pending: {
                icon: needsPayment ? 'payment' : 'schedule',
                color: '#ff9800',
                text: needsPayment ? 'Payment Required' : 'Pending Confirmation',
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

        return statusConfigs[status] || statusConfigs.pending;
    },
};

// 🔧 NEW: Filter utilities
export const FilterUtils = {
    /**
     * Filter bookings by status
     */
    filterByStatus: (bookings: any[], status: BookingStatus | 'all') => {
        if (status === 'all') {
            return bookings;
        }

        return bookings.filter(booking => {
            const actualStatus = StatusUtils.getActualStatus(booking);
            return actualStatus === status;
        });
    },

    /**
     * Calculate real stats from bookings
     */
    calculateStats: (bookings: any[]): BookingStats => {
        const stats: BookingStats = {
            total: bookings.length,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
        };

        bookings.forEach(booking => {
            const actualStatus = StatusUtils.getActualStatus(booking);
            stats[actualStatus]++;
        });

        return stats;
    },

    /**
     * Sort bookings by priority (pending payment first, then by date)
     */
    sortByPriority: (bookings: any[]) => {
        return [...bookings].sort((a, b) => {
            // Priority 1: Pending payment first
            const aNeedsPayment = StatusUtils.needsPayment(a);
            const bNeedsPayment = StatusUtils.needsPayment(b);

            if (aNeedsPayment && !bNeedsPayment) return -1;
            if (bNeedsPayment && !aNeedsPayment) return 1;

            // Priority 2: Active bookings before completed/cancelled
            const aIsActive = StatusUtils.isActive(a);
            const bIsActive = StatusUtils.isActive(b);

            if (aIsActive && !bIsActive) return -1;
            if (bIsActive && !aIsActive) return 1;

            // Priority 3: Sort by departure time (or created time)
            const dateA = new Date(a.trip?.departureTime || a.createdAt);
            const dateB = new Date(b.trip?.departureTime || b.createdAt);

            return dateB.getTime() - dateA.getTime(); // Most recent first
        });
    },
};

// 🔧 NEW: Analytics utilities
export const AnalyticsUtils = {
    /**
     * Calculate comprehensive booking analytics
     */
    calculateAnalytics: (bookings: any[]): BookingAnalytics => {
        const stats = FilterUtils.calculateStats(bookings);
        const completedBookings = bookings.filter(b => StatusUtils.getActualStatus(b) === 'completed');
        const cancelledBookings = bookings.filter(b => StatusUtils.getActualStatus(b) === 'cancelled');

        const totalSpent = completedBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0);
        const averageSpent = completedBookings.length > 0 ? totalSpent / completedBookings.length : 0;

        const attempted = completedBookings.length + cancelledBookings.length;
        const successRate = attempted > 0 ? Math.round((completedBookings.length / attempted) * 100) : 0;
        const completionRate = bookings.length > 0 ? Math.round((completedBookings.length / bookings.length) * 100) : 0;

        // Calculate monthly spending
        const monthlyData = new Map<string, { amount: number; trips: number }>();
        completedBookings.forEach(booking => {
            const date = new Date(booking.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const existing = monthlyData.get(monthKey) || { amount: 0, trips: 0 };
            monthlyData.set(monthKey, {
                amount: existing.amount + (booking.amount || 0),
                trips: existing.trips + 1
            });
        });

        const monthlySpending = Array.from(monthlyData.entries())
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month));

        // Find most used route
        const routeCounts = new Map<string, number>();
        bookings.forEach(booking => {
            if (booking.trip?.route) {
                const startName = booking.trip.route.startStation?.name || 'Unknown';
                const endName = booking.trip.route.endStation?.name || 'Unknown';
                const route = `${startName} → ${endName}`;
                routeCounts.set(route, (routeCounts.get(route) || 0) + 1);
            }
        });

        const mostUsedRoute = Array.from(routeCounts.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'No routes yet';

        return {
            totalBookings: stats.total,
            activeBookings: stats.pending + stats.confirmed,
            completedTrips: stats.completed,
            cancelledBookings: stats.cancelled,
            totalSpent: Math.round(totalSpent * 100) / 100,
            averageSpentPerTrip: Math.round(averageSpent * 100) / 100,
            successRate,
            completionRate,
            pendingPayments: bookings.filter(StatusUtils.needsPayment).length,
            onTimeTrips: completedBookings.length, // Simplified - could be enhanced
            mostUsedRoute,
            totalDistance: 0, // Could be calculated from route data
            totalTravelTime: 0, // Could be calculated from trip data
            monthlySpending,
            statusBreakdown: stats,
        };
    },
};