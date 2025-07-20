//  app/(passenger)/booking/components/SeatSelector.tsx 

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBookingFlow } from '../hooks/useBookingFlow';

export default function SeatSelector() {
    const { state, actions } = useBookingFlow();
    const { trip, selectedSeats, validation } = state;

    if (!trip) return null;

    const maxSeats = Math.min(trip.availableSeats, 4);
    const canDecrease = selectedSeats > 1;
    const canIncrease = selectedSeats < maxSeats;
    const totalAmount = actions.calculateTotalAmount();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Seats</Text>

            <View style={styles.selectorRow}>
                <TouchableOpacity
                    style={[styles.button, !canDecrease && styles.buttonDisabled]}
                    onPress={() => actions.updateSeats(selectedSeats - 1)}
                    disabled={!canDecrease || state.step === 'processing'}
                    activeOpacity={0.7}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                    <MaterialIcons
                        name="remove"
                        size={20}
                        color={canDecrease ? '#fff' : '#ccc'}
                    />
                </TouchableOpacity>

                <View style={styles.display}>
                    <Text style={styles.seatCount}>{selectedSeats}</Text>
                    <Text style={styles.seatLabel}>
                        seat{selectedSeats > 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.seatPrice}>
                        ${totalAmount.toFixed(2)} total
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.button, !canIncrease && styles.buttonDisabled]}
                    onPress={() => actions.updateSeats(selectedSeats + 1)}
                    disabled={!canIncrease || state.step === 'processing'}
                    activeOpacity={0.7}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                    <MaterialIcons
                        name="add"
                        size={20}
                        color={canIncrease ? '#fff' : '#ccc'}
                    />
                </TouchableOpacity>
            </View>

            <Text style={styles.availabilityText}>
                Available: {trip.availableSeats} • Max per booking: 4
            </Text>

            {validation.errors.seats && (
                <View style={styles.errorContainer}>
                    <MaterialIcons name="error" size={16} color="#f44336" />
                    <Text style={styles.errorText}>{validation.errors.seats}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    selectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    button: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#0066cc',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 44,
        minWidth: 44,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    display: {
        marginHorizontal: 40,
        alignItems: 'center',
    },
    seatCount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
    },
    seatLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    seatPrice: {
        fontSize: 16,
        color: '#0066cc',
        fontWeight: '600',
        marginTop: 4,
    },
    availabilityText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#ffebee',
        borderRadius: 6,
    },
    errorText: {
        fontSize: 14,
        color: '#f44336',
        marginLeft: 8,
        flex: 1,
    },
});