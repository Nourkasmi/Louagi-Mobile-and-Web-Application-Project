//  app/(passenger)/booking/components/StatusMessage.tsx 

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBookingFlow } from '../hooks/useBookingFlow';
import { BookingHelpers } from '../utils/bookingHelpers';

export default function StatusMessage() {
    const { state } = useBookingFlow();
    const { step, trip, selectedSeats } = state;

    if (!trip) return null;

    const message = BookingHelpers.getContextualMessage(trip, selectedSeats);

    const getMessageStyle = () => {
        if (step === 'failed') {
            return { backgroundColor: '#ffebee', color: '#d32f2f', icon: 'error' };
        }
        if (step === 'completed') {
            return { backgroundColor: '#e8f5e9', color: '#2e7d32', icon: 'check-circle' };
        }
        if (step === 'payment') {
            return { backgroundColor: '#e3f2fd', color: '#1976d2', icon: 'payment' };
        }
        if (trip.availableSeats <= 2) {
            return { backgroundColor: '#fff3cd', color: '#f57c00', icon: 'warning' };
        }
        return { backgroundColor: '#e3f2fd', color: '#1976d2', icon: 'info' };
    };

    const messageStyle = getMessageStyle();

    return (
        <View style={[styles.container, { backgroundColor: messageStyle.backgroundColor }]}>
            <MaterialIcons
                name={messageStyle.icon as any}
                size={20}
                color={messageStyle.color}
            />
            <Text style={[styles.text, { color: messageStyle.color }]}>
                {message}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 8,
    },
    text: {
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
});
