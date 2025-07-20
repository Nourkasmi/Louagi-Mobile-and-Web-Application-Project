// app/(passenger)/bookings/index.tsx 

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getMyBookings, type Booking } from '../../../src/services/api';

// Simple status - only show meaningful bookings
const getSimpleStatus = (booking: Booking) => {
    // If payment is completed, it's confirmed
    if (booking.paymentStatus === 'completed') {
        return booking.trip?.status === 'completed' ? 'completed' : 'confirmed';
    }

    // If trip is completed
    if (booking.trip?.status === 'completed') {
        return 'completed';
    }

    // If cancelled
    if (booking.status === 'cancelled' || booking.trip?.status === 'cancelled') {
        return 'cancelled';
    }

    // Everything else is filtered out (we don't show pending payments)
    return 'filtered';
};

const getStatusInfo = (status: string) => {
    switch (status) {
        case 'confirmed':
            return {
                icon: 'check-circle',
                color: '#28a745',
                text: 'Confirmed',
                bgColor: '#e8f5e8'
            };
        case 'completed':
            return {
                icon: 'done-all',
                color: '#007bff',
                text: 'Completed',
                bgColor: '#e3f2fd'
            };
        case 'cancelled':
            return {
                icon: 'cancel',
                color: '#f44336',
                text: 'Cancelled',
                bgColor: '#ffebee'
            };
        default:
            return {
                icon: 'help',
                color: '#666',
                text: 'Unknown',
                bgColor: '#f5f5f5'
            };
    }
};

const formatDate = (dateString: string) => {
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
        return 'Invalid Date';
    }
};

const formatTime = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return 'Invalid Time';
    }
};

const getRoute = (booking: Booking) => {
    const start = booking.trip?.route?.startStation?.name || 'Departure';
    const end = booking.trip?.route?.endStation?.name || 'Destination';
    return `${start} → ${end}`;
};

// Simple Booking Card Component
const SimpleBookingCard = ({ booking, onPress }: { booking: Booking; onPress: () => void }) => {
    const status = getSimpleStatus(booking);
    const statusInfo = getStatusInfo(status);
    const departureTime = booking.trip?.departureTime || booking.createdAt;

    return (
        <TouchableOpacity style={styles.bookingCard} onPress={onPress} activeOpacity={0.7}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <Text style={styles.bookingReference}>#{booking.bookingReference}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                    <MaterialIcons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                        {statusInfo.text}
                    </Text>
                </View>
            </View>

            {/* Route */}
            <View style={styles.routeContainer}>
                <MaterialIcons name="route" size={20} color="#0066cc" />
                <Text style={styles.routeText}>{getRoute(booking)}</Text>
            </View>

            {/* Details */}
            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <MaterialIcons name="event" size={16} color="#666" />
                    <Text style={styles.detailText}>{formatDate(departureTime)}</Text>
                </View>

                <View style={styles.detailItem}>
                    <MaterialIcons name="schedule" size={16} color="#666" />
                    <Text style={styles.detailText}>
                        {booking.trip?.departureTime ? formatTime(departureTime) : 'When full'}
                    </Text>
                </View>

                <View style={styles.detailItem}>
                    <MaterialIcons name="people" size={16} color="#666" />
                    <Text style={styles.detailText}>{booking.seats} seat{booking.seats > 1 ? 's' : ''}</Text>
                </View>
            </View>

            {/* Amount */}
            <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Total Paid</Text>
                <Text style={styles.amountValue}>${booking.amount || '0.00'}</Text>
            </View>
        </TouchableOpacity>
    );
};

export default function BookingsScreen() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBookings = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError(null);

            const response = await getMyBookings({ limit: 50 });

            if (response.success) {
                // Extract bookings from different response structures
                let bookingsList: Booking[] = [];

                if (response.data?.bookings && Array.isArray(response.data.bookings)) {
                    bookingsList = response.data.bookings;
                } else if (Array.isArray(response.data)) {
                    bookingsList = response.data;
                } else if (response.bookings && Array.isArray(response.bookings)) {
                    bookingsList = response.bookings;
                }

                // Filter to only show meaningful bookings (paid or completed)
                const meaningfulBookings = bookingsList.filter(booking => {
                    const status = getSimpleStatus(booking);
                    return status === 'confirmed' || status === 'completed' || status === 'cancelled';
                });

                // Sort by creation date (newest first)
                meaningfulBookings.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                setBookings(meaningfulBookings);
            } else {
                setError(response.message || 'Failed to load bookings');
                setBookings([]);
            }
        } catch (err: any) {
            console.error('Error fetching bookings:', err);
            setError('Failed to load bookings. Please try again.');
            setBookings([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const handleBookingPress = useCallback((booking: Booking) => {
        router.push({
            pathname: '/(passenger)/bookings/[id]',
            params: {
                id: booking.id,
                bookingData: JSON.stringify(booking)
            }
        });
    }, [router]);

    const renderBookingItem = useCallback(({ item }: { item: Booking }) => (
        <SimpleBookingCard
            booking={item}
            onPress={() => handleBookingPress(item)}
        />
    ), [handleBookingPress]);

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <MaterialIcons name="confirmation-number" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyText}>
                Your confirmed bookings will appear here after you complete payment.
            </Text>
            <TouchableOpacity
                style={styles.bookTripButton}
                onPress={() => router.push('/(passenger)/home')}
            >
                <MaterialIcons name="add" size={20} color="white" />
                <Text style={styles.bookTripButtonText}>Book Your First Trip</Text>
            </TouchableOpacity>
        </View>
    );

    if (loading && bookings.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Bookings</Text>
                    <TouchableOpacity onPress={() => router.push('/(passenger)/home')}>
                        <MaterialIcons name="add" size={24} color="#0066cc" />
                    </TouchableOpacity>
                </View>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0066cc" />
                    <Text style={styles.loadingText}>Loading your bookings...</Text>
                </View>
            </View>
        );
    }

    if (error && bookings.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>My Bookings</Text>
                    <TouchableOpacity onPress={() => router.push('/(passenger)/home')}>
                        <MaterialIcons name="add" size={24} color="#0066cc" />
                    </TouchableOpacity>
                </View>
                <View style={styles.centered}>
                    <MaterialIcons name="error-outline" size={64} color="#f44336" />
                    <Text style={styles.errorTitle}>Failed to Load</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => fetchBookings()}>
                        <Text style={styles.retryButtonText}>🔄 Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Simple Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Bookings</Text>
                <View style={styles.headerRight}>
                    <Text style={styles.bookingCount}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</Text>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push('/(passenger)/home')}
                    >
                        <MaterialIcons name="add" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Simple Bookings List */}
            <FlatList
                data={bookings}
                keyExtractor={(item) => item.id}
                renderItem={renderBookingItem}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchBookings(true)}
                        colors={['#0066cc']}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={renderEmpty}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        paddingTop: 60,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },

    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    bookingCount: {
        fontSize: 14,
        color: '#666',
        marginRight: 12,
    },

    addButton: {
        backgroundColor: '#0066cc',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },

    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },

    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },

    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#f44336',
        marginBottom: 8,
        marginTop: 16,
    },

    errorText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },

    retryButton: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },

    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },

    listContainer: {
        padding: 16,
        paddingBottom: 32,
    },

    separator: {
        height: 12,
    },

    // Booking Card Styles
    bookingCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },

    bookingReference: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0066cc',
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },

    statusText: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },

    routeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#e3f2fd',
        padding: 8,
        borderRadius: 6,
    },

    routeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0066cc',
        marginLeft: 8,
    },

    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    detailText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },

    amountContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },

    amountLabel: {
        fontSize: 14,
        color: '#666',
    },

    amountValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#28a745',
    },

    // Empty State Styles
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        minHeight: 400,
    },

    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },

    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },

    bookTripButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0066cc',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    bookTripButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});