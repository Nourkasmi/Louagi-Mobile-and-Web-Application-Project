// app/(passenger)/booking/components/BookingScreen.tsx - SIMPLIFIED Without Payment Logic
import React, { useMemo } from 'react';
import { View, ScrollView, ActivityIndicator, Text, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useBookingFlow } from '../hooks/useBookingFlow';

export default function SimplifiedBookingScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();

    const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;
    const tripData = Array.isArray(params.tripData) ? params.tripData[0] : params.tripData;

    // Extract context data from params
    const stationName = Array.isArray(params.stationName) ? params.stationName[0] : params.stationName;
    const destinationName = Array.isArray(params.destinationName) ? params.destinationName[0] : params.destinationName;
    const stationId = Array.isArray(params.stationId) ? params.stationId[0] : params.stationId;
    const destinationId = Array.isArray(params.destinationId) ? params.destinationId[0] : params.destinationId;

    // Parse trip data once
    const initialTrip = useMemo(() => {
        if (!tripData) return null;
        try {
            return typeof tripData === 'string' ? JSON.parse(tripData) : tripData;
        } catch (error) {
            console.error('❌ Failed to parse tripData:', error);
            return null;
        }
    }, [tripData]);

    // Create context data for the booking flow
    const contextData = useMemo(() => ({
        stationName: stationName || 'Departure Station',
        destinationName: destinationName || 'Destination Station',
        selectedDestination: {
            id: destinationId,
            endStation: {
                id: destinationId,
                name: destinationName || 'Destination Station',
                address: '456 Destination Ave',
                city: 'Sfax',
                state: 'Sfax Governorate',
                zipCode: '3000',
                capacity: 100,
                isActive: true,
                amenities: {},
            }
        },
        searchParams: { stationId, destinationId },
    }), [stationName, destinationName, stationId, destinationId]);

    const { state, actions } = useBookingFlow(tripId as string, initialTrip, contextData);

    console.log('📺 BookingScreen render:', {
        step: state.step,
        hasTrip: !!state.trip,
        loading: state.loading,
        error: state.error,
    });

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

    if (state.loading && !state.trip) {
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

    if (state.error && !state.trip) {
        return (
            <View style={styles.container}>
                {renderHeader()}
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Failed to Load Trip</Text>
                    <Text style={styles.errorSubtext}>{state.error}</Text>
                    <TouchableOpacity style={styles.button} onPress={actions.retryLoading}>
                        <Text style={styles.buttonText}>🔄 Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!state.trip) {
        return (
            <View style={styles.container}>
                {renderHeader()}
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Trip Not Available</Text>
                    <TouchableOpacity style={styles.button} onPress={actions.goBack}>
                        <Text style={styles.buttonText}>← Go Back</Text>
                    </TouchableOpacity>
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
                <Text style={styles.title}>Book Your Trip</Text>
                <View style={styles.placeholder} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}

            {/* Progress */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${state.progress * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {state.step === 'selecting' && 'Select your seats and book'}
                    {state.step === 'processing' && 'Creating your booking...'}
                    {state.step === 'completed' && 'Booking created successfully!'}
                    {state.step === 'failed' && 'Please try again'}
                </Text>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={state.refreshing}
                        onRefresh={actions.refreshTripData}
                        colors={['#0066cc']}
                    />
                }
            >
                {/* Trip Info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Trip Information</Text>

                    <Text style={styles.tripRoute}>
                        {state.trip.route?.startStation?.name || contextData.stationName} → {state.trip.route?.endStation?.name || contextData.destinationName}
                    </Text>

                    <Text style={styles.tripDetail}>Capacity: {state.trip.capacity} seats</Text>
                    <Text style={styles.tripDetail}>Available: {state.trip.availableSeats} seats</Text>
                    <Text style={styles.tripDetail}>Price: ${state.trip.currentPrice || state.trip.basePrice}</Text>

                    <Text style={styles.tripDescription}>
                        {state.trip.route?.description || `Trip from ${contextData.stationName} to ${contextData.destinationName}`}
                    </Text>
                </View>

                {/* Driver Information */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Driver Information</Text>

                    <View style={styles.driverSection}>
                        <View style={styles.driverAvatar}>
                            <Text style={styles.driverInitial}>
                                {state.trip.driver?.user?.username?.charAt(0).toUpperCase() || 'A'}
                            </Text>
                        </View>

                        <View style={styles.driverInfo}>
                            <Text style={styles.driverName}>
                                {state.trip.driver?.user?.username || 'Ahmed Ben Salem'}
                            </Text>
                            <View style={styles.driverMeta}>
                                <Text style={styles.driverRating}>
                                    ⭐ {state.trip.driver?.rating?.toFixed(1) || '4.7'}
                                </Text>
                                <Text style={styles.driverExperience}>
                                    • {state.trip.driver?.experience || 8} years experience
                                </Text>
                            </View>
                            <Text style={styles.vehicleInfo}>
                                {state.trip.driver?.vehicleType || '8-Seater Van'} • {state.trip.capacity} seats
                            </Text>
                            <Text style={styles.licenseInfo}>
                                License: {state.trip.driver?.licenseNo || 'TN-123456789'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Seat Selector */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Select Seats</Text>
                    <View style={styles.seatSelector}>
                        <TouchableOpacity
                            style={[styles.seatButton, state.selectedSeats <= 1 && styles.seatButtonDisabled]}
                            onPress={() => actions.updateSeats(state.selectedSeats - 1)}
                            disabled={state.selectedSeats <= 1}
                        >
                            <Text style={styles.seatButtonText}>-</Text>
                        </TouchableOpacity>

                        <View style={styles.seatDisplay}>
                            <Text style={styles.seatCount}>{state.selectedSeats}</Text>
                            <Text style={styles.seatLabel}>seat{state.selectedSeats > 1 ? 's' : ''}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.seatButton, state.selectedSeats >= Math.min(state.trip.availableSeats, 4) && styles.seatButtonDisabled]}
                            onPress={() => actions.updateSeats(state.selectedSeats + 1)}
                            disabled={state.selectedSeats >= Math.min(state.trip.availableSeats, 4)}
                        >
                            <Text style={styles.seatButtonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Price Summary */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Price Summary</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Seats × {state.selectedSeats}</Text>
                        <Text style={styles.priceValue}>${actions.calculateTotalAmount().toFixed(2)}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>${actions.calculateTotalAmount().toFixed(2)}</Text>
                    </View>
                </View>

                {/* Step-specific Content */}
                {state.step === 'completed' && (
                    <View style={styles.successCard}>
                        <Text style={styles.successIcon}>🎉</Text>
                        <Text style={styles.successTitle}>Booking Created!</Text>
                        <Text style={styles.successText}>Your booking has been created successfully!</Text>
                        {state.createdBooking && (
                            <Text style={styles.bookingRef}>#{state.createdBooking.bookingReference}</Text>
                        )}
                        <Text style={styles.nextStepText}>
                            Complete payment to confirm your seat
                        </Text>
                    </View>
                )}

                {state.step === 'failed' && (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorIcon}>❌</Text>
                        <Text style={styles.errorTitle}>Booking Failed</Text>
                        <Text style={styles.errorText}>{state.error}</Text>
                    </View>
                )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                {state.step === 'completed' ? (
                    <View style={styles.completedActions}>
                        <TouchableOpacity style={styles.outlineButton} onPress={actions.viewBookingDetails}>
                            <Text style={styles.outlineButtonText}>View Booking</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.primaryButton} onPress={actions.proceedToPayment}>
                            <MaterialIcons name="payment" size={20} color="white" />
                            <Text style={styles.primaryButtonText}>Pay Now</Text>
                        </TouchableOpacity>
                    </View>
                ) : state.step === 'processing' ? (
                    <View style={styles.processingContainer}>
                        <ActivityIndicator size="large" color="#0066cc" />
                        <Text style={styles.processingText}>Creating your booking...</Text>
                    </View>
                ) : state.step === 'failed' ? (
                    <TouchableOpacity style={styles.retryButton} onPress={actions.createBooking}>
                        <MaterialIcons name="refresh" size={20} color="white" />
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.bookButton, (state.trip.availableSeats === 0 || state.loading) && styles.buttonDisabled]}
                        onPress={actions.createBooking}
                        disabled={state.trip.availableSeats === 0 || state.loading}
                    >
                        {state.loading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <MaterialIcons
                                    name={state.trip.availableSeats === 0 ? 'block' : 'confirmation-number'}
                                    size={20}
                                    color="white"
                                />
                                <Text style={styles.bookButtonText}>
                                    {state.trip.availableSeats === 0 ? 'Trip Full' : `Create Booking - $${actions.calculateTotalAmount().toFixed(2)}`}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
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
        width: 60,
    },

    progressContainer: {
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },

    progressBar: {
        height: 4,
        backgroundColor: '#e9ecef',
        borderRadius: 2,
        marginBottom: 8,
    },

    progressFill: {
        height: '100%',
        backgroundColor: '#0066cc',
        borderRadius: 2,
    },

    progressText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontWeight: '500',
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

    tripRoute: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0066cc',
        marginBottom: 8,
    },

    tripDetail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },

    tripDescription: {
        fontSize: 14,
        color: '#888',
        fontStyle: 'italic',
        marginTop: 8,
    },

    driverSection: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    driverAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#0066cc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },

    driverInitial: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },

    driverInfo: {
        flex: 1,
    },

    driverName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },

    driverMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },

    driverRating: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },

    driverExperience: {
        fontSize: 14,
        color: '#666',
    },

    vehicleInfo: {
        fontSize: 14,
        color: '#888',
        marginBottom: 2,
    },

    licenseInfo: {
        fontSize: 12,
        color: '#aaa',
    },

    seatSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    seatButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#0066cc',
        justifyContent: 'center',
        alignItems: 'center',
    },

    seatButtonDisabled: {
        backgroundColor: '#ccc',
    },

    seatButtonText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
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

    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    priceLabel: {
        fontSize: 16,
        color: '#666',
    },

    priceValue: {
        fontSize: 16,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },

    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0066cc',
    },

    successCard: {
        backgroundColor: '#e8f5e8',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },

    successIcon: {
        fontSize: 48,
        marginBottom: 12,
    },

    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 8,
    },

    successText: {
        fontSize: 14,
        color: '#2e7d32',
        textAlign: 'center',
        marginBottom: 8,
    },

    bookingRef: {
        fontSize: 16,
        color: '#2e7d32',
        fontWeight: '600',
        marginBottom: 8,
    },

    nextStepText: {
        fontSize: 14,
        color: '#2e7d32',
        textAlign: 'center',
        fontWeight: '500',
    },

    errorCard: {
        backgroundColor: '#ffebee',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },

    errorIcon: {
        fontSize: 48,
        marginBottom: 12,
    },

    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginBottom: 8,
    },

    errorText: {
        fontSize: 14,
        color: '#d32f2f',
        textAlign: 'center',
    },

    errorSubtext: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },

    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },

    actionsContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
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
        minHeight: 56,
    },

    retryButton: {
        backgroundColor: '#f44336',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        minHeight: 56,
    },

    retryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },

    buttonDisabled: {
        backgroundColor: '#ccc',
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

    completedActions: {
        flexDirection: 'row',
        gap: 12,
    },

    outlineButton: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0066cc',
        backgroundColor: 'white',
        alignItems: 'center',
    },

    outlineButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0066cc',
    },

    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#0066cc',
    },

    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginLeft: 8,
    },

    processingContainer: {
        alignItems: 'center',
        padding: 30,
    },

    processingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        textAlign: 'center',
    },

    button: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        minHeight: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },

    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});