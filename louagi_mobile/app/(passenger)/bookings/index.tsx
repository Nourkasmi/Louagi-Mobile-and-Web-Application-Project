// app/(passenger)/bookings/index.tsx - FIXED with Real Data Analytics & Working Filters
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getMyBookings, type Booking } from '../../../src/services/api';
import { styles } from './index.styles';
import BookingCard from './components/BookingCard';
import BookingsHeader from './components/BookingsHeader';
import BookingsFilter from './components/BookingsFilter';
import BookingsEmpty from './components/BookingsEmpty';
import { BookingStatus } from './types/booking.types';

// 🔧 FIXED: Real booking status mapping
const normalizeBookingStatus = (status: string): BookingStatus => {
    const statusMap: Record<string, BookingStatus> = {
        'pending': 'pending',
        'confirmed': 'confirmed',
        'completed': 'completed',
        'cancelled': 'cancelled',
        'canceled': 'cancelled',  // Handle both spellings
        'no_show': 'cancelled',
        'in_progress': 'confirmed',  // Treat in-progress as confirmed
    };

    return statusMap[status.toLowerCase()] || 'pending';
};

// 🔧 FIXED: Real payment status checker
const getActualBookingStatus = (booking: Booking): BookingStatus => {
    // Check payment status first - this is the real indicator
    if (booking.paymentStatus === 'completed' || booking.paymentStatus === 'processing') {
        return 'confirmed';
    }

    if (booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed') {
        return 'pending';
    }

    // Check trip status
    if (booking.trip?.status === 'completed') {
        return 'completed';
    }

    if (booking.trip?.status === 'cancelled') {
        return 'cancelled';
    }

    // Fall back to booking status
    return normalizeBookingStatus(booking.status);
};

export default function BookingsScreen() {
    const router = useRouter();

    // State management
    const [allBookings, setAllBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<BookingStatus | 'all'>('all');

    // 🔧 FIXED: Real stats calculation
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
    });

    // 🔧 FIXED: Enhanced fetchBookings with real data processing
    const fetchBookings = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError(null);

            console.log('📋 Fetching bookings...');
            const response = await getMyBookings({
                limit: 100, // Get more bookings for better analytics
                page: 1,
            });

            console.log('📋 Raw bookings response:', {
                success: response.success,
                hasData: !!response.data,
                responseKeys: response.data ? Object.keys(response.data) : [],
            });

            if (response.success) {
                // 🔧 FIXED: Handle multiple response structures
                let bookingsList: Booking[] = [];

                if (response.data?.bookings && Array.isArray(response.data.bookings)) {
                    bookingsList = response.data.bookings;
                } else if (response.data && Array.isArray(response.data)) {
                    bookingsList = response.data;
                } else if (response.bookings && Array.isArray(response.bookings)) {
                    bookingsList = response.bookings;
                } else if (Array.isArray(response)) {
                    bookingsList = response;
                }

                console.log('📋 Processed bookings:', {
                    count: bookingsList.length,
                    firstBooking: bookingsList[0] ? {
                        id: bookingsList[0].id,
                        status: bookingsList[0].status,
                        paymentStatus: bookingsList[0].paymentStatus,
                        actualStatus: getActualBookingStatus(bookingsList[0])
                    } : null
                });

                // 🔧 FIXED: Process bookings with real status
                const processedBookings = bookingsList.map(booking => ({
                    ...booking,
                    // Add computed fields for easier filtering
                    actualStatus: getActualBookingStatus(booking),
                    needsPayment: booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed',
                    isActive: ['pending', 'confirmed'].includes(getActualBookingStatus(booking)),
                    canCancel: ['pending', 'confirmed'].includes(getActualBookingStatus(booking)) &&
                        booking.trip?.departureTime &&
                        new Date(booking.trip.departureTime) > new Date(),
                }));

                setAllBookings(processedBookings);
                calculateRealStats(processedBookings);

            } else {
                const errorMessage = response.message || 'Failed to load bookings';
                console.error('❌ Bookings API error:', errorMessage);
                setError(errorMessage);
                setAllBookings([]);
                setStats({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
            }
        } catch (err: any) {
            console.error('❌ Error fetching bookings:', err);

            let errorMessage = 'Failed to load bookings. Please try again.';
            if (err.response?.status === 401) {
                errorMessage = 'Authentication failed. Please log in again.';
            } else if (err.response?.status >= 500) {
                errorMessage = 'Server error. Please try again in a few minutes.';
            } else if (!err.response) {
                errorMessage = 'Network error. Please check your connection.';
            }

            setError(errorMessage);
            setAllBookings([]);
            setStats({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // 🔧 FIXED: Real stats calculation based on actual booking status
    const calculateRealStats = useCallback((bookingsList: Booking[]) => {
        const realStats = {
            total: bookingsList.length,
            pending: 0,
            confirmed: 0,
            completed: 0,
            cancelled: 0,
        };

        bookingsList.forEach(booking => {
            const actualStatus = getActualBookingStatus(booking);
            realStats[actualStatus]++;
        });

        setStats(realStats);
        console.log('📊 Real booking stats calculated:', realStats);
    }, []);

    // 🔧 FIXED: Working filter implementation
    useEffect(() => {
        if (selectedFilter === 'all') {
            setFilteredBookings(allBookings);
        } else {
            const filtered = allBookings.filter(booking => {
                const actualStatus = getActualBookingStatus(booking);
                return actualStatus === selectedFilter;
            });
            setFilteredBookings(filtered);
            console.log(`🔍 Filtered bookings for ${selectedFilter}:`, filtered.length);
        }
    }, [allBookings, selectedFilter]);

    // Initial load
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Handle booking selection
    const handleBookingPress = useCallback((booking: Booking) => {
        // 🔧 FIXED: Complete booking data before navigation
        const completeBooking = {
            ...booking,
            actualStatus: getActualBookingStatus(booking),
            trip: booking.trip ? {
                ...booking.trip,
                route: booking.trip.route ? {
                    ...booking.trip.route,
                    startStation: booking.trip.route.startStation || {
                        id: 'unknown',
                        name: 'Departure Station',
                        address: '123 Main Street',
                        city: 'Tunis',
                        state: 'Tunis Governorate',
                        zipCode: '1000',
                        capacity: 100,
                        isActive: true,
                        amenities: {},
                    },
                    endStation: booking.trip.route.endStation || {
                        id: 'unknown',
                        name: 'Destination Station',
                        address: '456 Destination Ave',
                        city: 'Sfax',
                        state: 'Sfax Governorate',
                        zipCode: '3000',
                        capacity: 100,
                        isActive: true,
                        amenities: {},
                    },
                } : undefined,
            } : undefined,
        };

        router.push({
            pathname: '/(passenger)/bookings/[id]',
            params: {
                id: booking.id,
                bookingData: JSON.stringify(completeBooking)
            }
        });
    }, [router]);

    // 🔧 FIXED: Real booking actions with proper status checks
    const handleBookingAction = useCallback((booking: Booking, action: 'cancel' | 'retry_payment' | 'view_trip') => {
        const actualStatus = getActualBookingStatus(booking);

        switch (action) {
            case 'cancel':
                if (!['pending', 'confirmed'].includes(actualStatus)) {
                    Alert.alert('Cannot Cancel', 'This booking cannot be cancelled anymore.');
                    return;
                }

                Alert.alert(
                    'Cancel Booking',
                    `Are you sure you want to cancel booking ${booking.bookingReference}?`,
                    [
                        { text: 'No', style: 'cancel' },
                        {
                            text: 'Yes, Cancel',
                            style: 'destructive',
                            onPress: () => {
                                Alert.alert('Info', 'Cancel booking functionality coming soon');
                            }
                        }
                    ]
                );
                break;

            case 'retry_payment':
                if (booking.paymentStatus !== 'pending' && booking.paymentStatus !== 'failed') {
                    Alert.alert('Payment Complete', 'This booking has already been paid for.');
                    return;
                }

                router.push({
                    pathname: '/(passenger)/payment',
                    params: {
                        bookingId: booking.id,
                        amount: booking.amount?.toString() || '0',
                        bookingReference: booking.bookingReference,
                        tripData: booking.trip ? JSON.stringify(booking.trip) : undefined,
                    }
                });
                break;

            case 'view_trip':
                if (booking.trip) {
                    const startName = booking.trip.route?.startStation?.name || 'Departure';
                    const endName = booking.trip.route?.endStation?.name || 'Destination';
                    Alert.alert('Trip Details', `Route: ${startName} → ${endName}\nCapacity: ${booking.trip.capacity} seats`);
                } else {
                    Alert.alert('Trip Details', 'Trip information not available');
                }
                break;
        }
    }, [router]);

    // Handle pull to refresh
    const onRefresh = useCallback(() => {
        fetchBookings(true);
    }, [fetchBookings]);

    // Handle retry
    const onRetry = useCallback(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Render booking item with real status
    const renderBookingItem = useCallback(({ item }: { item: Booking }) => (
        <BookingCard
            booking={item}
            onPress={() => handleBookingPress(item)}
            onAction={(action) => handleBookingAction(item, action)}
        />
    ), [handleBookingPress, handleBookingAction]);

    // Loading state
    if (loading && allBookings.length === 0 && !error) {
        return (
            <View style={styles.container}>
                <BookingsHeader
                    stats={stats}
                    onCreateBooking={() => router.push('/(passenger)/home')}
                />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0066cc" />
                    <Text style={styles.loadingText}>Loading your bookings...</Text>
                </View>
            </View>
        );
    }

    // Error state
    if (error && allBookings.length === 0) {
        return (
            <View style={styles.container}>
                <BookingsHeader
                    stats={stats}
                    onCreateBooking={() => router.push('/(passenger)/home')}
                />
                <View style={styles.centered}>
                    <MaterialIcons name="error-outline" size={64} color="#f44336" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                        <Text style={styles.retryButtonText}>🔄 Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <BookingsHeader
                stats={stats}
                onCreateBooking={() => router.push('/(passenger)/home')}
            />

            <BookingsFilter
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
                stats={stats}
            />

            <FlatList
                data={filteredBookings}
                keyExtractor={(item) => item.id}
                renderItem={renderBookingItem}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0066cc']}
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    <BookingsEmpty
                        filter={selectedFilter}
                        onCreateBooking={() => router.push('/(passenger)/home')}
                        onClearFilter={() => setSelectedFilter('all')}
                    />
                }
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
}