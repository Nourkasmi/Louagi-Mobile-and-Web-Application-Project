// app/(passenger)/booking/hooks/usePaymentFlow.ts - PAYMENT MANAGEMENT HOOK
import { useState } from 'react';
import { useMockPaymentSheet } from '../../../../src/services/mockPaymentService';
import type { Booking } from '../../../../src/services/api';

export function usePaymentFlow() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    const { initPaymentSheet, presentPaymentSheet } = useMockPaymentSheet();

    const initPayment = async (booking: Booking) => {
        try {
            setLoading(true);
            setError(null);

            console.log('💳 Initializing mock payment for booking:', booking.id);

            // Create mock payment intent
            const mockClientSecret = `pi_mock_${booking.id}_secret_${Date.now()}`;

            // Initialize mock payment sheet
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
            console.log('✅ Mock payment sheet initialized successfully');

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

            console.log('💳 Presenting mock payment sheet...');

            const { error: paymentError } = await presentPaymentSheet();

            if (paymentError) {
                if (paymentError.code === 'Canceled') {
                    console.log('⚠️ Payment was cancelled by user');
                    return { error: paymentError };
                }
                throw new Error(paymentError.message);
            }

            console.log('✅ Mock payment completed successfully');
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