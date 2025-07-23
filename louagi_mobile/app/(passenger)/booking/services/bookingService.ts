//  app/(passenger)/booking/services/bookingService.ts 
import { createBooking as apiCreateBooking, type Booking } from '../../../../src/services/api';

export interface CreateBookingRequest {
    tripId: string;
    seats: number;
    specialRequests?: string;
}

export interface CreateBookingResponse {
    booking: Booking;
    wasAutoStarted: boolean;
    autoConfirmedBookings: number;
}

export class BookingService {
    /**
     *  Create a new booking with proper success/error handling
     */
    static async createBooking(request: CreateBookingRequest): Promise<CreateBookingResponse> {
        try {
            console.log('📝 BookingService.createBooking called with:', request);

            // Validate request
            const validationErrors = this.validateBookingRequest(request);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            // Call API
            console.log(' Calling API createBooking...');
            const response = await apiCreateBooking(request);

            console.log('📡 API createBooking response:', {
                success: response.success,
                hasData: !!response.data,
                wasAutoStarted: response.wasAutoStarted,
                autoConfirmedBookings: response.autoConfirmedBookings,
                message: response.message
            });

            // 🔧 FIXED: Check for success properly
            if (response.success && response.data) {
                console.log(' BookingService.createBooking successful:', {
                    bookingId: response.data.id,
                    bookingReference: response.data.bookingReference,
                    wasAutoStarted: response.wasAutoStarted || false
                });

                return {
                    booking: response.data,
                    wasAutoStarted: response.wasAutoStarted || false,
                    autoConfirmedBookings: response.autoConfirmedBookings || 0,
                };
            }

            // 🔧 FIXED: Handle API success but no data
            if (response.success && !response.data) {
                console.error(' API returned success but no booking data');
                throw new Error('Booking creation succeeded but no booking data received');
            }

            // 🔧 FIXED: Handle API failure
            console.error(' API returned failure:', response.message);
            throw new Error(response.message || 'Failed to create booking');

        } catch (error: any) {
            console.error('BookingService.createBooking error:', error);

            // 🔧 FIXED: Don't treat success messages as errors
            if (error.message && error.message.toLowerCase().includes('successfully')) {
                console.warn(' Caught success message as error, this should not happen');
                // Try to parse the error to see if it contains booking data
                console.log('🔍 Full error object:', error);

                // This should not happen, but if it does, we need more info
                throw new Error('Booking may have been created but response parsing failed. Please check your bookings.');
            }

            // Enhanced error handling
            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            }

            if (error.message) {
                throw new Error(error.message);
            }

            throw new Error('Failed to create booking. Please try again.');
        }
    }

    /**
     * Validate booking request data
     */
    static validateBookingRequest(request: CreateBookingRequest): string[] {
        const errors: string[] = [];

        // Validate trip ID
        if (!request.tripId || typeof request.tripId !== 'string') {
            errors.push('Valid trip ID is required');
        }

        // Validate seats
        if (!Number.isInteger(request.seats) || request.seats < 1) {
            errors.push('At least 1 seat is required');
        }

        if (request.seats > 4) {
            errors.push('Maximum 4 seats per booking');
        }

        // Validate special requests (optional)
        if (request.specialRequests !== undefined) {
            if (typeof request.specialRequests !== 'string') {
                errors.push('Special requests must be a string');
            } else if (request.specialRequests.length > 500) {
                errors.push('Special requests must be 500 characters or less');
            }
        }

        return errors;
    }

    /**
     * Format booking for display
     */
    static formatBookingForDisplay(booking: Booking) {
        return {
            id: booking.id,
            reference: booking.bookingReference,
            status: booking.status,
            seats: booking.seats,
            totalAmount: booking.totalAmount,
            createdAt: booking.createdAt,
            trip: booking.trip,
        };
    }

    /**
     * Check if booking can be modified
     */
    static canModifyBooking(booking: Booking): boolean {
        const modifiableStatuses = ['PENDING', 'CONFIRMED'];
        return modifiableStatuses.includes(booking.status);
    }

    /**
     * Check if booking can be cancelled
     */
    static canCancelBooking(booking: Booking): boolean {
        const cancellableStatuses = ['PENDING', 'CONFIRMED'];

        if (!cancellableStatuses.includes(booking.status)) {
            return false;
        }

        // Check if trip hasn't started yet
        if (booking.trip?.departureTime) {
            const departureTime = new Date(booking.trip.departureTime);
            const now = new Date();
            const timeDiff = departureTime.getTime() - now.getTime();
            const hoursUntilDeparture = timeDiff / (1000 * 60 * 60);

            // Can cancel up to 1 hour before departure
            return hoursUntilDeparture > 1;
        }

        return true;
    }

    /**
     * Calculate refund amount for cancellation
     */
    static calculateRefundAmount(booking: Booking): number {
        if (!this.canCancelBooking(booking)) {
            return 0;
        }

        const totalAmount = booking.totalAmount || 0;

        // Calculate refund based on time until departure
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
            } else if (hoursUntilDeparture > 1) {
                return totalAmount * 0.2; // 20% refund
            }
        }

        return 0; // No refund
    }

    /**
     * Get booking status display text
     */
    static getStatusDisplayText(status: string): string {
        const statusMap: Record<string, string> = {
            'PENDING': 'Pending Payment',
            'CONFIRMED': 'Confirmed',
            'IN_PROGRESS': 'Trip in Progress',
            'COMPLETED': 'Completed',
            'CANCELED': 'Canceled',
            'REFUNDED': 'Refunded',
        };

        return statusMap[status] || status;
    }

    /**
     * Get booking status color
     */
    static getStatusColor(status: string): string {
        const colorMap: Record<string, string> = {
            'PENDING': '#ff9800',
            'CONFIRMED': '#4caf50',
            'IN_PROGRESS': '#2196f3',
            'COMPLETED': '#4caf50',
            'CANCELED': '#f44336',
            'REFUNDED': '#9e9e9e',
        };

        return colorMap[status] || '#9e9e9e';
    }
}