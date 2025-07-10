// app/(passenger)/booking/index.tsx - CLEAN MAIN ENTRY POINT
import React from 'react';
import { MockStripeProvider } from '../../../src/services/mockPaymentService';
import BookingScreen from './components/BookingScreen';

export default function BookingIndex() {
    return (
        <MockStripeProvider publishableKey="mock_key">
            <BookingScreen />
        </MockStripeProvider>
    );
}