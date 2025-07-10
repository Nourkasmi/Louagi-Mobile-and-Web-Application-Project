// 📁 app/(passenger)/booking/components/BookingScreen.tsx - SIMPLIFIED VERSION
import React, { useMemo } from 'react';
import { View, ScrollView, ActivityIndicator, Text, RefreshControl, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBookingFlow } from '../hooks/useBookingFlow';

export default function BookingScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();

    const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;
    const tripData = Array.isArray(params.tripData) ? params.tripData[0] : params.tripData;

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

    const { state, actions } = useBookingFlow(tripId as string, initialTrip);

    console.log('📺 BookingScreen render:', {
        step: state.step,
        hasTrip: !!state.trip,
        loading: state.loading,
        error: state.error
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={actions.goBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Book Your Trip</Text>
                    <View style={styles.mockBadge}>
                        <Text style={styles.mockText}>Mock Pay</Text>
                    </View>
                </View>
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={actions.goBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Book Your Trip</Text>
                </View>
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={actions.goBack} style={styles.backButton}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Book Your Trip</Text>
                </View>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Trip Not Available</Text>
                    <TouchableOpacity style={styles.button} onPress={actions.goBack}>
                        <Text style={styles.buttonText}>← Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={actions.goBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Book Your Trip</Text>
                <View style={styles.mockBadge}>
                    <Text style={styles.mockText}>Mock Pay</Text>
                </View>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${state.progress * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {state.step === 'selecting' && 'Step 1: Select Seats'}
                    {state.step === 'processing' && 'Step 2: Creating Booking...'}
                    {state.step === 'payment' && 'Step 3: Mock Payment'}
                    {state.step === 'completed' && 'Completed!'}
                    {state.step === 'failed' && 'Please Try Again'}
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
                {/* Mock Payment Notice */}
                <View style={styles.mockNotice}>
                    <Text style={styles.mockNoticeText}>
                        🎭 Mock Payment Mode: No real money will be charged during testing!
                    </Text>
                </View>

                {/* Trip Info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Trip Information</Text>
                    <Text style={styles.tripRoute}>
                        {state.trip.route?.startStation?.name || 'Departure'} → {state.trip.route?.endStation?.name || 'Destination'}
                    </Text>
                    <Text style={styles.tripDetail}>Capacity: {state.trip.capacity} seats</Text>
                    <Text style={styles.tripDetail}>Available: {state.trip.availableSeats} seats</Text>
                    <Text style={styles.tripDetail}>Price: ${state.trip.currentPrice || state.trip.basePrice}</Text>
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
                        <Text style={styles.successTitle}>Booking Completed!</Text>
                        <Text style={styles.successText}>Your trip has been booked successfully!</Text>
                        {state.createdBooking && (
                            <Text style={styles.bookingRef}>#{state.createdBooking.bookingReference}</Text>
                        )}
                    </View>
                )}

                {state.step === 'payment' && (
                    <View style={styles.paymentCard}>
                        <Text style={styles.paymentIcon}>💳</Text>
                        <Text style={styles.paymentTitle}>Ready for Payment</Text>
                        <Text style={styles.paymentText}>Complete your mock payment to confirm booking</Text>
                    </View>
                )}

                {state.step === 'failed' && (
                    <View style={styles.errorCard}>
                        <Text style={styles.errorIcon}>❌</Text>
                        <Text style={styles.errorTitle}>Booking Failed</Text>
                        <Text style={styles.errorText}>{state.error}</Text>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    {state.step === 'completed' ? (
                        <View style={styles.completedActions}>
                            <TouchableOpacity style={styles.outlineButton} onPress={actions.viewBookingDetails}>
                                <Text style={styles.outlineButtonText}>View Booking</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button} onPress={actions.goHome}>
                                <Text style={styles.buttonText}>Go Home</Text>
                            </TouchableOpacity>
                        </View>
                    ) : state.step === 'payment' ? (
                        <View>
                            <TouchableOpacity
                                style={[styles.payButton, state.paymentLoading && styles.buttonDisabled]}
                                onPress={actions.processPayment}
                                disabled={state.paymentLoading}
                            >
                                {state.paymentLoading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.buttonText}>🎭 Mock Pay ${actions.calculateTotalAmount().toFixed(2)}</Text>
                                )}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.skipButton} onPress={actions.skipPayment}>
                                <Text style={styles.skipButtonText}>Complete Later</Text>
                            </TouchableOpacity>
                        </View>
                    ) : state.step === 'processing' ? (
                        <View style={styles.processingContainer}>
                            <ActivityIndicator size="large" color="#0066cc" />
                            <Text style={styles.processingText}>Creating your booking...</Text>
                        </View>
                    ) : state.step === 'failed' ? (
                        <TouchableOpacity style={styles.button} onPress={actions.createBooking}>
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.button, (state.trip.availableSeats === 0 || state.loading) && styles.buttonDisabled]}
                            onPress={actions.createBooking}
                            disabled={state.trip.availableSeats === 0 || state.loading}
                        >
                            {state.loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {state.trip.availableSeats === 0 ? 'Trip Full' : `Book Trip - $${actions.calculateTotalAmount().toFixed(2)}`}
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Mock Payment Info */}
                <View style={styles.mockInfo}>
                    <Text style={styles.mockInfoTitle}>🎭 Mock Payment Information:</Text>
                    <Text style={styles.mockInfoText}>• This is a test environment - no real payments</Text>
                    <Text style={styles.mockInfoText}>• Visa •••• 4242 and MasterCard •••• 5555 succeed</Text>
                    <Text style={styles.mockInfoText}>• Amex •••• 1234 and Visa •••• 0000 fail for testing</Text>
                </View>
            </ScrollView>
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
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#0066cc',
        fontWeight: '600',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    mockBadge: {
        backgroundColor: '#fff3cd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    mockText: {
        fontSize: 12,
        color: '#856404',
        fontWeight: '600',
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
    mockNotice: {
        backgroundColor: '#fff3cd',
        margin: 16,
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
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
    paymentCard: {
        backgroundColor: '#fff3cd',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    errorCard: {
        backgroundColor: '#ffebee',
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
    },
    paymentIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    paymentTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 8,
    },
    paymentText: {
        fontSize: 14,
        color: '#856404',
        textAlign: 'center',
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
    button: {
        backgroundColor: '#0066cc',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        minHeight: 56,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    payButton: {
        backgroundColor: '#ff9800',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        minHeight: 56,
    },
    skipButton: {
        backgroundColor: 'transparent',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ff9800',
    },
    skipButtonText: {
        color: '#ff9800',
        fontSize: 16,
        fontWeight: '600',
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
    mockInfo: {
        backgroundColor: '#fff3cd',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    mockInfoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#856404',
        marginBottom: 12,
    },
    mockInfoText: {
        fontSize: 14,
        color: '#856404',
        marginBottom: 4,
    },
});