// app/(passenger)/search/trips.tsx 

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
    getTrips,
    type Trip
} from '../../../src/services/api';
import { theme } from '../../../src/styles/theme';

export default function TripsListScreen() {
    const {
        stationId,
        stationName,
        destinationId,
        destinationName,
    } = useLocalSearchParams<{
        stationId: string;
        stationName: string;
        destinationId: string;
        destinationName: string;
    }>();

    const router = useRouter();

    // State management
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Search trips function
    const searchTrips = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await getTrips({
                destinationId: destinationId,
                status: 'scheduled',
                page: 1,
                limit: 20
            });

            let tripList = [];
            if (response.success) {
                if (response.data?.trips) {
                    tripList = response.data.trips;
                } else if (response.trips) {
                    tripList = response.trips;
                } else if (Array.isArray(response.data)) {
                    tripList = response.data;
                }

                // Filter for available trips
                const availableTrips = Array.isArray(tripList) ?
                    tripList.filter(trip => trip.availableSeats > 0) : [];

                setTrips(availableTrips);

                if (availableTrips.length === 0 && tripList.length > 0) {
                    Alert.alert(
                        'Trips Found But Full',
                        'All available trips are currently full. New trips are created when drivers become available.'
                    );
                }
            } else {
                setTrips([]);
            }
        } catch (error) {
            console.error('Error searching trips:', error);
            setTrips([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [destinationId]);

    // Auto-refresh trips every 30 seconds
    useEffect(() => {
        searchTrips();

        const interval = setInterval(() => {
            searchTrips(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [searchTrips]);

    // Helper functions
    const formatTime = (dateString: string | null) => {
        if (!dateString) return 'When full';
        try {
            return new Date(dateString).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return 'When full';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Today';
        try {
            const date = new Date(dateString);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            if (date.toDateString() === today.toDateString()) return 'Today';
            if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Today';
        }
    };

    const getTripStatusInfo = (trip: Trip) => {
        const bookedSeats = trip.capacity - trip.availableSeats;
        const percentageFull = Math.round((bookedSeats / trip.capacity) * 100);

        if (percentageFull >= 90) {
            return {
                text: 'Almost Full!',
                color: theme.colors.status.pending,
                urgent: true
            };
        } else if (percentageFull >= 75) {
            return {
                text: 'Filling Up',
                color: theme.colors.status.inProgress,
                urgent: false
            };
        } else {
            return {
                text: 'Available',
                color: theme.colors.status.confirmed,
                urgent: false
            };
        }
    };

    // Navigate to booking screen
    const selectTrip = (trip: Trip) => {
        try {
            if (!trip || !trip.id) {
                Alert.alert('Error', 'Invalid trip data. Please try again.');
                return;
            }

            // Prepare complete trip data
            const completeTrip = {
                ...trip,
                route: {
                    ...trip.route,
                    startStation: {
                        id: stationId,
                        name: stationName,
                        address: '123 Main Street',
                        city: 'Tunis',
                        state: 'Tunis Governorate',
                        zipCode: '1000',
                        capacity: 100,
                        isActive: true,
                        contactPhone: '+216 XX XXX XXX',
                        contactEmail: 'station@louagi.com',
                        amenities: {},
                        ...trip.route?.startStation,
                    },
                    endStation: {
                        id: destinationId,
                        name: destinationName,
                        address: '456 Destination Ave',
                        city: 'Sfax',
                        state: 'Sfax Governorate',
                        zipCode: '3000',
                        capacity: 100,
                        isActive: true,
                        contactPhone: '+216 XX XXX XXX',
                        contactEmail: 'destination@louagi.com',
                        amenities: {},
                        ...trip.route?.endStation,
                    },
                },
            };

            const tripDataString = JSON.stringify(completeTrip);

            // Navigate to booking
            router.push({
                pathname: '/(passenger)/booking',
                params: {
                    tripId: completeTrip.id,
                    tripData: tripDataString,
                    stationName: stationName,
                    destinationName: destinationName,
                    stationId: stationId,
                    destinationId: destinationId,
                }
            });

        } catch (error) {
            console.error('❌ Error navigating to booking:', error);
            Alert.alert(
                'Navigation Error',
                'Unable to open booking screen. Please try selecting the trip again.'
            );
        }
    };

    // Render trip item
    const renderTripItem = ({ item }: { item: Trip }) => {
        const bookedSeats = item.capacity - item.availableSeats;
        const statusInfo = getTripStatusInfo(item);
        const pricePerSeat = parseFloat(item.currentPrice || item.basePrice || '36') / item.capacity;

        return (
            <TouchableOpacity
                style={[
                    styles.tripCard,
                    statusInfo.urgent && styles.urgentTripCard
                ]}
                onPress={() => selectTrip(item)}
                disabled={item.availableSeats === 0}
            >
                {/* Trip Header */}
                <View style={styles.tripHeader}>
                    <View style={styles.timeContainer}>
                        <Text style={styles.tripTime}>
                            {formatTime(item.departureTime)}
                        </Text>
                        <Text style={styles.tripDate}>
                            {formatDate(item.departureTime)}
                        </Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                        <Text style={styles.statusText}>{statusInfo.text}</Text>
                    </View>
                </View>

                {/* Capacity Visual */}
                <View style={styles.capacitySection}>
                    <View style={styles.capacityHeader}>
                        <Text style={styles.capacityLabel}>Seats</Text>
                        <Text style={styles.capacityCount}>
                            {bookedSeats}/{item.capacity} filled
                        </Text>
                    </View>

                    <View style={styles.capacityBar}>
                        <View
                            style={[
                                styles.capacityFill,
                                {
                                    width: `${(bookedSeats / item.capacity) * 100}%`,
                                    backgroundColor: statusInfo.color
                                }
                            ]}
                        />
                    </View>

                    <View style={styles.seatIndicators}>
                        {Array.from({ length: item.capacity }, (_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.seatIndicator,
                                    {
                                        backgroundColor: index < bookedSeats ? statusInfo.color : '#e9ecef'
                                    }
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Trip Details */}
                <View style={styles.tripDetails}>
                    <View style={styles.driverSection}>
                        <Text style={styles.driverName}>
                            🚗 {item.driver?.user?.username || 'Ahmed Ben Salem'}
                        </Text>
                        <Text style={styles.vehicleInfo}>
                            {item.driver?.vehicleType || '8-Seater Van'} • ⭐ {item.driver?.rating?.toFixed(1) || '4.7'}
                        </Text>
                    </View>

                    <Text style={styles.durationText}>
                        ⏱️ {item.route?.estimatedDuration || 180} min trip
                    </Text>
                </View>

                {/* Price and Book Button */}
                <View style={styles.tripFooter}>
                    <View style={styles.priceSection}>
                        <Text style={styles.priceLabel}>Price per seat</Text>
                        <Text style={styles.price}>${pricePerSeat.toFixed(2)}</Text>
                    </View>

                    <View style={styles.bookSection}>
                        <Text style={styles.availableSeats}>
                            {item.availableSeats} seat{item.availableSeats !== 1 ? 's' : ''} left
                        </Text>
                        {statusInfo.urgent && (
                            <Text style={styles.urgentText}>Book now!</Text>
                        )}
                    </View>
                </View>

                {/* Auto-start indicator */}
                {!item.departureTime && (
                    <View style={styles.autoStartIndicator}>
                        <Text style={styles.autoStartText}>
                            🚀 Starts automatically when full
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // Render header
    const renderHeader = () => (
        <View style={styles.header}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

            <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Available Trips</Text>

                <TouchableOpacity onPress={() => searchTrips(true)} style={styles.refreshButton}>
                    <MaterialIcons name="refresh" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            <View style={styles.routeBanner}>
                <View style={styles.routeInfo}>
                    <MaterialIcons name="route" size={20} color="#ffffff" />
                    <Text style={styles.routeText}>
                        {stationName} → {destinationName}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.changeRouteText}>Change</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                {renderHeader()}
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Searching available trips...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}

            <FlatList
                data={trips}
                keyExtractor={(item) => item.id}
                renderItem={renderTripItem}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => searchTrips(true)}
                        colors={[theme.colors.primary]}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialIcons name="directions-bus" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No trips available right now</Text>
                        <Text style={styles.emptySubtext}>
                            Trips are created when drivers declare availability.{'\n'}
                            Pull to refresh or try again in a few minutes.
                        </Text>
                        <TouchableOpacity
                            style={styles.refreshEmptyButton}
                            onPress={() => searchTrips()}
                        >
                            <MaterialIcons name="refresh" size={20} color="#ffffff" />
                            <Text style={styles.refreshEmptyButtonText}>Check Again</Text>
                        </TouchableOpacity>
                    </View>
                }
                ListHeaderComponent={
                    trips.length > 0 ? (
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeaderText}>
                                {trips.length} trip{trips.length !== 1 ? 's' : ''} available • Updates every 30s
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

// Styles for the trips screen
const styles = {
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },

    // Header styles
    header: {
        backgroundColor: theme.colors.primary,
        paddingBottom: 20,
    },

    headerTop: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        justifyContent: 'space-between' as const,
    },

    backButton: {
        padding: 8,
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: '700' as const,
        color: '#ffffff',
        flex: 1,
        textAlign: 'center' as const,
    },

    refreshButton: {
        padding: 8,
    },

    routeBanner: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        marginHorizontal: 16,
    },

    routeInfo: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        flex: 1,
    },

    routeText: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: '#ffffff',
        marginLeft: 8,
    },

    changeRouteText: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: '#ffffff',
        textDecorationLine: 'underline' as const,
    },

    // Loading and centered content
    centered: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        padding: 40,
    },

    loadingText: {
        fontSize: 16,
        color: theme.colors.text.secondary,
        marginTop: 16,
        textAlign: 'center' as const,
    },

    // List styles
    listContainer: {
        padding: 16,
        paddingBottom: 32,
    },

    listHeader: {
        marginBottom: 16,
        backgroundColor: theme.colors.background.accent,
        padding: 12,
        borderRadius: 8,
    },

    listHeaderText: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: theme.colors.text.info,
        textAlign: 'center' as const,
    },

    // Trip card styles
    tripCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    urgentTripCard: {
        borderWidth: 2,
        borderColor: theme.colors.warning,
    },

    tripHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 16,
    },

    timeContainer: {
        flex: 1,
    },

    tripTime: {
        fontSize: 24,
        fontWeight: 'bold' as const,
        color: theme.colors.text.primary,
    },

    tripDate: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },

    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },

    statusText: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: '#ffffff',
    },

    // Capacity section
    capacitySection: {
        marginBottom: 16,
    },

    capacityHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'center' as const,
        marginBottom: 8,
    },

    capacityLabel: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },

    capacityCount: {
        fontSize: 14,
        fontWeight: '600' as const,
        color: theme.colors.text.primary,
    },

    capacityBar: {
        height: 6,
        backgroundColor: '#e9ecef',
        borderRadius: 3,
        marginBottom: 12,
    },

    capacityFill: {
        height: '100%',
        borderRadius: 3,
    },

    seatIndicators: {
        flexDirection: 'row' as const,
        justifyContent: 'center' as const,
        gap: 4,
    },

    seatIndicator: {
        width: 12,
        height: 12,
        borderRadius: 2,
    },

    // Trip details
    tripDetails: {
        marginBottom: 16,
    },

    driverSection: {
        marginBottom: 8,
    },

    driverName: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: theme.colors.text.primary,
        marginBottom: 4,
    },

    vehicleInfo: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },

    durationText: {
        fontSize: 14,
        color: theme.colors.text.secondary,
    },

    // Trip footer
    tripFooter: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'flex-end' as const,
    },

    priceSection: {
        flex: 1,
    },

    priceLabel: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },

    price: {
        fontSize: 20,
        fontWeight: 'bold' as const,
        color: theme.colors.primary,
    },

    bookSection: {
        alignItems: 'flex-end' as const,
    },

    availableSeats: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },

    urgentText: {
        fontSize: 12,
        color: theme.colors.text.danger,
        fontWeight: '600' as const,
    },

    // Auto-start indicator
    autoStartIndicator: {
        backgroundColor: theme.colors.background.success,
        padding: 12,
        borderRadius: 6,
        marginTop: 12,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.button.success,
    },

    autoStartText: {
        fontSize: 12,
        color: theme.colors.text.success,
        fontWeight: '500' as const,
        textAlign: 'center' as const,
    },

    // Empty state
    emptyState: {
        alignItems: 'center' as const,
        padding: 40,
        paddingTop: 80,
    },

    emptyText: {
        fontSize: 20,
        fontWeight: '600' as const,
        color: theme.colors.text.secondary,
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center' as const,
    },

    emptySubtext: {
        fontSize: 16,
        color: theme.colors.text.tertiary,
        textAlign: 'center' as const,
        lineHeight: 22,
        marginBottom: 32,
    },

    refreshEmptyButton: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: theme.colors.button.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },

    refreshEmptyButtonText: {
        fontSize: 16,
        fontWeight: '600' as const,
        color: '#ffffff',
    },
};