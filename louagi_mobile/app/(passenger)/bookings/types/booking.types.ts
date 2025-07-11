// app/(passenger)/bookings/types/booking.types.ts - Booking Type Definitions
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export type BookingAction = 'cancel' | 'retry_payment' | 'view_trip' | 'download_receipt';

export interface BookingStats {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
}

export interface BookingFilter {
    status?: BookingStatus | 'all';
    dateRange?: {
        start: string;
        end: string;
    };
    searchText?: string;
}

export interface BookingDisplayData {
    id: string;
    reference: string;
    status: BookingStatus;
    route: string;
    date: string;
    time: string;
    amount: number;
    seats: number;
    canCancel: boolean;
    needsPayment: boolean;
    showTripInfo: boolean;
}