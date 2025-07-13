// app/(passenger)/booking/hooks/usePaymentFlow.ts - FIXED Payment Hook
import { useState } from 'react';
import { useMockPaymentSheet, mockPaymentService } from '../../../../src/services/mockPaymentService';
import type { Booking } from '../../../../src/services/api';

export function usePaymentFlow() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    // Use FIXED mock payment service
    const { initPaymentSheet, presentPaymentSheet } = useMockPaymentSheet();

    const initPayment = async (booking: Booking) => {
        try {
            setLoading(true);
            setError(null);

            console.log('💳 Initializing FIXED mock payment for booking:', booking.id);

            // Create mock payment intent client secret
            const mockClientSecret = `pi_mock_${booking.id}_secret_${Date.now()}`;

            // Initialize FIXED mock payment sheet
            const { error: initError } = await initPaymentSheet({
                merchantDisplayName: 'Louagi Mock',
                paymentIntentClientSecret: mockClientSecret,
                allowsDelayedPaymentMethods: false,
                defaultBillingDetails: {
                    name: 'Test User',
                },
            });

            if (initError) {
                throw new Error(initError.message);
            }

            setClientSecret(mockClientSecret);
            console.log('✅ FIXED mock payment sheet initialized successfully');

            return { success: true };
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to initialize payment';
            setError(errorMessage);
            console.error('❌ Payment initialization error:', errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const processPayment = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('💳 Presenting FIXED mock payment sheet...');

            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                if (paymentError.code === 'Canceled') {
                    console.log('⚠️ Payment was cancelled by user');
                    return { error: paymentError };
                }
                throw new Error(paymentError.message);
            }

            console.log('✅ FIXED mock payment completed successfully');
            return { success: true };

        } catch (err: any) {
            const errorMessage = err.message || 'Payment failed';
            setError(errorMessage);
            console.error('❌ Payment processing error:', errorMessage);
            return { error: { message: errorMessage, code: 'PaymentFailed' } };
        } finally {
            setLoading(false);
        }
    };

    const resetPayment = () => {
        setLoading(false);
        setError(null);
        setClientSecret(null);
        mockPaymentService.reset();
    };

    return {
        loading,
        error,
        clientSecret,
        initPaymentSheet: initPayment,
        presentPaymentSheet: processPayment,
        resetPayment,
    };
}