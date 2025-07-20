// app/(passenger)/booking/components/BookingActions.tsx 
import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBookingFlow } from '../hooks/useBookingFlow';

export default function BookingActions() {
    const { state, actions } = useBookingFlow();
    const { step, trip, validation, paymentLoading, createdBooking } = state;

    if (!trip) return null;

    const totalAmount = actions.calculateTotalAmount();
    const isProcessing = step === 'processing' || paymentLoading;
    const hasErrors = Object.keys(validation.errors).length > 0;
    const tripFull = trip.availableSeats === 0;

    // Payment step - FIXED mock payment
    if (step === 'payment') {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={[styles.payButton, isProcessing && styles.buttonDisabled]}
                    onPress={() => {
                        console.log('🎭 Mock Pay button pressed - processing payment...');
                        actions.processPayment();
                    }}
                    disabled={isProcessing}
                    activeOpacity={0.8}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    {isProcessing ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator color="white" size="small" />
                            <Text style={styles.payButtonText}>Processing...</Text>
                        </View>
                    ) : (
                        <View style={styles.buttonContent}>
                            <MaterialIcons name="payment" size={20} color="white" />
                            <Text style={styles.payButtonText}>
                                🎭 Mock Pay ${totalAmount.toFixed(2)}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => {
                        Alert.alert(
                            'Skip Mock Payment?',
                            'You can complete mock payment later from "My Bookings".',
                            [
                                { text: 'Complete Now', onPress: () => actions.processPayment() },
                                { text: 'Skip', onPress: () => actions.skipPayment() }
                            ]
                        );
                    }}
                    disabled={isProcessing}
                >
                    <Text style={styles.skipButtonText}>Complete Mock Payment Later</Text>
                </TouchableOpacity>

                {/* Test card info */}
                <TouchableOpacity
                    style={styles.infoButton}
                    onPress={() => {
                        Alert.alert(
                            '💳 Mock Test Cards',
                            '✅ SUCCESS CARDS:\n' +
                            '• Visa •••• 4242 - Always succeeds\n' +
                            '• MasterCard •••• 5555 - Always succeeds\n\n' +
                            '❌ FAILURE CARDS:\n' +
                            '• Amex •••• 1234 - Always declines\n' +
                            '• Visa •••• 0000 - Insufficient funds\n\n' +
                            '🎭 This is a test environment - no real money charged!',
                            [{ text: 'Got it!', style: 'default' }]
                        );
                    }}
                >
                    <MaterialIcons name="info" size={16} color="#ff9800" />
                    <Text style={styles.infoButtonText}>View Test Cards</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Completed step
    if (step === 'completed') {
        return (
            <View style={styles.successActions}>
                <TouchableOpacity
                    style={styles.successButton}
                    onPress={actions.viewBookingDetails}
                    activeOpacity={0.7}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                    <MaterialIcons name="visibility" size={20} color="#0066cc" />
                    <Text style={styles.successButtonText}>View Booking Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.successButton, styles.homeButton]}
                    onPress={actions.goHome}
                    activeOpacity={0.7}
                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                    <MaterialIcons name="home" size={20} color="white" />
                    <Text style={[styles.successButtonText, { color: 'white' }]}>Go Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Failed step
    if (step === 'failed') {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={actions.createBooking}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="refresh" size={20} color="white" />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Main booking button
    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.bookButton,
                    (isProcessing || tripFull || hasErrors) && styles.buttonDisabled
                ]}
                onPress={() => {
                    console.log('🎯 Book Trip button pressed - creating booking...');
                    actions.createBooking();
                }}
                disabled={isProcessing || tripFull || hasErrors}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                {isProcessing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator color="white" size="small" />
                        <Text style={styles.bookButtonText}>Processing...</Text>
                    </View>
                ) : (
                    <View style={styles.buttonContent}>
                        <MaterialIcons
                            name={tripFull ? 'block' : 'confirmation-number'}
                            size={20}
                            color="white"
                        />
                        <Text style={styles.bookButtonText}>
                            {tripFull ? 'Trip Full' : `Book Trip - $${totalAmount.toFixed(2)}`}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Validation errors */}
            {hasErrors && (
                <View style={styles.errorContainer}>
                    {Object.entries(validation.errors).map(([field, error]) => (
                        <View key={field} style={styles.errorRow}>
                            <MaterialIcons name="error" size={16} color="#f44336" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
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
    payButton: {
        backgroundColor: '#ff9800', // Orange for mock payment
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        minHeight: 56,
    },
    buttonDisabled: {
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
    payButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    skipButton: {
        backgroundColor: 'transparent',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ff9800',
        marginBottom: 12,
    },
    skipButtonText: {
        color: '#ff9800',
        fontSize: 16,
        fontWeight: '600',
    },
    infoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff3cd',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ff9800',
    },
    infoButtonText: {
        color: '#856404',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 4,
    },
    successActions: {
        flexDirection: 'row',
        gap: 12,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    successButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0066cc',
        backgroundColor: 'white',
        minHeight: 48,
    },
    homeButton: {
        backgroundColor: '#0066cc',
        borderColor: '#0066cc',
    },
    successButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0066cc',
        marginLeft: 8,
    },
    errorContainer: {
        marginTop: 12,
        backgroundColor: '#ffebee',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#f44336',
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    errorText: {
        fontSize: 14,
        color: '#f44336',
        marginLeft: 8,
        flex: 1,
    },
});