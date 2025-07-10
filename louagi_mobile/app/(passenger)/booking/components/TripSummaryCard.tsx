// 📁 app/(passenger)/booking/components/TripSummaryCard.tsx - TRIP DETAILS DISPLAY
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useBookingFlow } from '../hooks/useBookingFlow';
import { BookingHelpers } from '../utils/bookingHelpers';

export default function TripSummaryCard() {
    const { state } = useBookingFlow();
    const { trip } = state;

    if (!trip) return null;

    const bookedSeats = trip.capacity - trip.availableSeats;
    const percentageFull = (bookedSeats / trip.capacity) * 100;
    const statusInfo = BookingHelpers.getTripStatusInfo(trip);

    return (
        <View style={styles.container}>
            {/* Route Header */}
            <View style={styles.header}>
                <Text style={styles.routeText}>
                    {BookingHelpers.getTripRoute(trip)}
                </Text>
                {statusInfo.urgent && (
                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                        <MaterialIcons name="trending-up" size={16} color="#fff" />
                        <Text style={styles.statusText}>{statusInfo.text}</Text>
                    </View>
                )}
            </View>

            <Text style={styles.routeDescription}>
                {trip.route.description || 'Trip Route'}
            </Text>

            {/* Trip Details Grid */}
            <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                    <MaterialIcons name="schedule" size={20} color="#0066cc" />
                    <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Departure</Text>
                        <Text style={styles.detailValue}>
                            {BookingHelpers.formatTime(trip.departureTime)}
                        </Text>
                        <Text style={styles.detailSubtext}>
                            {BookingHelpers.formatDate(trip.departureTime)}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailItem}>
                    <MaterialIcons name="access-time" size={20} color="#666" />
                    <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Duration</Text>
                        <Text style={styles.detailValue}>
                            {BookingHelpers.formatDuration(trip.route.estimatedDuration)}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailItem}>
                    <MaterialIcons name="location-on" size={20} color="#28a745" />
                    <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Arrival</Text>
                        <Text style={styles.detailValue}>
                            {BookingHelpers.calculateEstimatedArrival(
                                trip.departureTime,
                                trip.route.estimatedDuration
                            )}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Driver Info */}
            {trip.driver && (
                <View style={styles.driverSection}>
                    <View style={styles.driverAvatar}>
                        <Text style={styles.driverInitial}>
                            {trip.driver.user?.username?.charAt(0).toUpperCase() || 'D'}
                        </Text>
                    </View>
                    <View style={styles.driverInfo}>
                        <Text style={styles.driverName}>
                            {trip.driver.user?.username || 'Unknown Driver'}
                        </Text>
                        <View style={styles.driverMeta}>
                            <MaterialIcons name="star" size={16} color="#ffc107" />
                            <Text style={styles.driverRating}>
                                {trip.driver.rating?.toFixed(1) || '5.0'}
                            </Text>
                            <Text style={styles.driverExperience}>
                                • {trip.driver.experience || 5} years
                            </Text>
                        </View>
                        <Text style={styles.vehicleInfo}>
                            {trip.driver.vehicleType || 'Vehicle'} • {trip.capacity} seats
                        </Text>
                    </View>
                </View>
            )}

            {/* Capacity Status */}
            <View style={styles.capacitySection}>
                <View style={styles.capacityHeader}>
                    <Text style={styles.capacityLabel}>Trip Capacity</Text>
                    <Text style={styles.capacityCount}>
                        {bookedSeats}/{trip.capacity} booked
                    </Text>
                </View>

                <View style={styles.capacityBar}>
                    <View
                        style={[
                            styles.capacityFill,
                            {
                                width: `${percentageFull}%`,
                                backgroundColor: BookingHelpers.getUrgencyColor(
                                    BookingHelpers.getTripUrgency(trip)
                                )
                            }
                        ]}
                    />
                </View>

                {/* Visual seat indicators */}
                <View style={styles.seatIndicators}>
                    {Array.from({ length: trip.capacity }, (_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.seatIndicator,
                                {
                                    backgroundColor: index < bookedSeats ? '#0066cc' : '#e9ecef'
                                }
                            ]}
                        />
                    ))}
                </View>

                <Text style={styles.availabilityText}>
                    {trip.availableSeats} seat{trip.availableSeats !== 1 ? 's' : ''} remaining
                </Text>
            </View>

            {/* Real-time Updates Info */}
            <View style={styles.updateInfo}>
                <MaterialIcons name="refresh" size={16} color="#666" />
                <Text style={styles.updateText}>
                    Updates automatically every 30 seconds
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    routeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    routeDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    detailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    detailItem: {
        flex: 1,
        alignItems: 'center',
    },
    detailContent: {
        alignItems: 'center',
        marginTop: 4,
    },
    detailLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    detailSubtext: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    driverSection: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        padding: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    driverAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#0066cc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    driverInitial: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    driverMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    driverRating: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    driverExperience: {
        fontSize: 14,
        color: '#666',
    },
    vehicleInfo: {
        fontSize: 12,
        color: '#888',
    },
    capacitySection: {
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    capacityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    capacityLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    capacityCount: {
        fontSize: 14,
        color: '#666',
    },
    capacityBar: {
        height: 8,
        backgroundColor: '#e9ecef',
        borderRadius: 4,
        marginBottom: 12,
    },
    capacityFill: {
        height: '100%',
        borderRadius: 4,
    },
    seatIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 8,
        gap: 4,
    },
    seatIndicator: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },
    availabilityText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    updateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    updateText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
});