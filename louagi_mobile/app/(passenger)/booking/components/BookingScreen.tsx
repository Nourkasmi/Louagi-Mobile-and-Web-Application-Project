// app/(passenger)/booking/components/BookingScreen.tsx 

import React, { useMemo } from 'react';
import { View, ScrollView, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useBookingFlow } from '../hooks/useBookingFlow';

export default function BookingScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();

    const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;
    const tripData = Array.isArray(params.tripData) ? params.tripData[0] : params.tripData;

    // Parse trip data
    const initialTrip = useMemo(() => {
        if (!tripData) return null;
        try {
            return typeof tripData === 'string' ? JSON.parse(tripData) : tripData;
        } catch (error) {
            console.error('❌ Failed to parse tripData:', error);
            return null;
        }
    }, [tripData]);

    const { state, actions } = useBookingFlow(tripId as string, initialTrip);

    if (!tripId) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Trip ID Missing</Text>
                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>← Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!state.trip) {
        return (
            <View style={styles.container}>
                {renderHeader()}
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0066cc" />
                    <Text style={styles.loadingText}>Loading trip details...</Text>
                </View>
            </View>
        );
    }

    function renderHeader() {
        return (
            <View style={styles.header}>
                <TouchableOpacity onPress={actions.goBack} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#0066cc" />
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Book & Pay</Text>
                <View style={styles.placeholder} />
            </View>
        );
    }

    const startName = state.trip.route?.startStation?.name || 'Departure';
    const endName = state.trip.route?.endStation?.name || 'Destination';

    return (
        <View style={styles.container}>
            {renderHeader()}

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Trip Info Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Trip Details</Text>

                    <View style={styles.routeContainer}>
                        <MaterialIcons name="route" size={24} color="#0066cc" />
                        <Text style={styles.routeText}>{startName} → {endName}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Capacity</Text>
                        <Text style={styles.detailValue}>{state.trip.capacity} seats</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Available</Text>
                        <Text style={styles.detailValue}>{state.trip.availableSeats} seats</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Trip Price</Text>
                        <Text style={styles.detailValue}>${state.trip.currentPrice || state.trip.basePrice}</Text>
                    </View>
                </View>

                {/* Seat Selection Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Select Seats</Text>

                    <View style={styles.seatSelector}>
                        <TouchableOpacity
                            style={[styles.seatButton, state.selectedSeats <= 1 && styles.seatButtonDisabled]}
                            onPress={() => actions.updateSeats(state.selectedSeats - 1)}
                            disabled={state.selectedSeats <= 1 || state.loading}
                        >
                            <MaterialIcons name="remove" size={24} color={state.selectedSeats <= 1 ? "#ccc" : "#fff"} />
                        </TouchableOpacity>

                        <View style={styles.seatDisplay}>
                            <Text style={styles.seatCount}>{state.selectedSeats}</Text>
                            <Text style={styles.seatLabel}>seat{state.selectedSeats > 1 ? 's' : ''}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.seatButton, state.selectedSeats >= Math.min(state.trip.availableSeats, 4) && styles.seatButtonDisabled]}
                            onPress={() => actions.updateSeats(state.selectedSeats + 1)}
                            disabled={state.selectedSeats >= Math.min(state.trip.availableSeats, 4) || state.loading}
                        >
                            <MaterialIcons name="add" size={24} color={state.selectedSeats >= Math.min(state.trip.availableSeats, 4) ? "#ccc" : "#fff"} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.seatInfo}>Maximum 4 seats per booking</Text>
                </View>

                {/* Price Summary Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Price Summary</Text>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Price per seat</Text>
                        <Text style={styles.priceValue}>
                            ${((state.trip.currentPrice || state.trip.basePrice || 36) / state.trip.capacity).toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Seats × {state.selectedSeats}</Text>
                        <Text style={styles.priceValue}>${actions.calculateTotalAmount().toFixed(2)}</Text>
                    </View>

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>${actions.calculateTotalAmount().toFixed(2)}</Text>
                    </View>
                </View>

                {/* Error Display */}
                {state.error && (
                    <View style={styles.errorCard}>
                        <MaterialIcons name="error" size={20} color="#f44336" />
                        <Text style={styles.errorMessage}>{state.error}</Text>
                    </View>
                )}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <MaterialIcons name="info" size={20} color="#0066cc" />
                    <Text style={styles.infoText}>
                        Clicking "Book & Pay" will create your booking and take you to payment.
                        Payment is required to confirm your seat.
                    </Text>
                </View>
            </ScrollView>

            {/* Single Book & Pay Button */}
            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.bookButton, (state.trip.availableSeats === 0 || state.loading || state.error) && styles.bookButtonDisabled]}
                    onPress={actions.bookAndPay}
                    disabled={state.trip.availableSeats === 0 || state.loading || !!state.error}
                >
                    {state.loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="white" size="small" />
                            <Text style={styles.bookButtonText}>Creating Booking...</Text>
                        </View>
                    ) : (
                        <View style={styles.buttonContent}>
                            <MaterialIcons name="payment" size={20} color="white" />
                            <Text style={styles.bookButtonText}>
                                Book & Pay ${actions.calculateTotalAmount().toFixed(2)}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },

    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        justifyContent: 'space-between',
    },

    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },

    backButtonText: {
        fontSize: 16,
        color: '#0066cc',
        fontWeight: '600',
        marginLeft: 4,
    },

    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },

    placeholder: {
        width: 80,
    },

    scrollContainer: {
        flex: 1,
    },

    card: {
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

    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },

    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e3f2fd',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },

    routeText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0066cc',
        marginLeft: 8,
    },

    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    detailLabel: {
        fontSize: 14,
        color: '#666',
    },

    detailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },

    seatSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },

    seatButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0066cc',
        justifyContent: 'center',
        alignItems: 'center',
    },

    seatButtonDisabled: {
        backgroundColor: '#ccc',
    },

    seatDisplay: {
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

    seatInfo: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },

    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    priceLabel: {
        fontSize: 14,
        color: '#666',
    },

    priceValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },

    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        marginTop: 8,
    },

    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },

    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0066cc',
    },

    errorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffebee',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#f44336',
    },

    errorMessage: {
        fontSize: 14,
        color: '#f44336',
        marginLeft: 8,
        flex: 1,
    },

    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#e3f2fd',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#0066cc',
    },

    infoText: {
        fontSize: 14,
        color: '#0066cc',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },

    actionContainer: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },

    bookButton: {
        backgroundColor: '#0066cc',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    bookButtonDisabled: {
        backgroundColor: '#ccc',
    },

    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    bookButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },

    // Error state styles
    errorText: {
        fontSize: 18,
        color: '#f44336',
        marginBottom: 20,
        textAlign: 'center',
    },

    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
    },

    button: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },

    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});