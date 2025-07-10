// 📁 app/(passenger)/booking/components/PriceSummary.tsx - PRICE BREAKDOWN COMPONENT
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useBookingFlow } from '../hooks/useBookingFlow';
import { BookingHelpers } from '../utils/bookingHelpers';

export default function PriceSummary() {
    const { state } = useBookingFlow();
    const { trip, selectedSeats } = state;

    if (!trip) return null;

    const pricing = BookingHelpers.calculatePricing(trip, selectedSeats);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Price Summary</Text>

            {/* Trip price details */}
            <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Trip Total Price</Text>
                <Text style={styles.priceValue}>
                    {BookingHelpers.formatPrice(pricing.totalTripPrice)}
                </Text>
            </View>

            <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Trip Capacity</Text>
                <Text style={styles.priceValue}>
                    {trip.capacity} seats
                </Text>
            </View>

            <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Price per seat</Text>
                <Text style={styles.priceValue}>
                    {BookingHelpers.formatPrice(pricing.pricePerSeat)}
                </Text>
            </View>

            {/* Selected seats */}
            <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                    Selected seats × {selectedSeats}
                </Text>
                <Text style={styles.priceValue}>
                    {BookingHelpers.formatPrice(pricing.totalAmount)}
                </Text>
            </View>

            {/* Discount if any */}
            {pricing.discountAmount > 0 && (
                <View style={styles.priceRow}>
                    <Text style={[styles.priceLabel, styles.discountLabel]}>Discount</Text>
                    <Text style={[styles.priceValue, styles.discountValue]}>
                        -{BookingHelpers.formatPrice(pricing.discountAmount)}
                    </Text>
                </View>
            )}

            {/* Total amount */}
            <View style={styles.divider} />
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                    {BookingHelpers.formatPrice(pricing.totalAmount - pricing.discountAmount)}
                </Text>
            </View>

            {/* Payment info */}
            <View style={styles.paymentInfo}>
                <Text style={styles.paymentInfoText}>
                    💳 Mock payment - No real money will be charged
                </Text>
            </View>
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
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 4,
    },
    priceLabel: {
        fontSize: 16,
        color: '#666',
        flex: 1,
    },
    priceValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        textAlign: 'right',
    },
    discountLabel: {
        color: '#28a745',
    },
    discountValue: {
        color: '#28a745',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
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
    paymentInfo: {
        backgroundColor: '#fff3cd',
        padding: 12,
        borderRadius: 6,
        marginTop: 12,
    },
    paymentInfoText: {
        fontSize: 12,
        color: '#856404',
        textAlign: 'center',
        fontWeight: '500',
    },
});