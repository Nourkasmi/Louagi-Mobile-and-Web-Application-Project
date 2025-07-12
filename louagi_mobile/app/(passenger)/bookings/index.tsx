// app/(passenger)/bookings/index.tsx - FIXED Bookings Screen
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

export default function BookingsScreen() {
    const router = useRouter();

    // State management
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<BookingStatus | 'all'>('all');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
    });

    // 🔧 FIXED: Enhanced fetchBookings with better error handling
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
                limit: 50,
                page: 1,
            });

            console.log('📋 Bookings API response:', {
                success: response.success,
                hasData: !!response.data,
                dataKeys: response.data ? Object.keys(response.data) : [],
                responseKeys: Object.keys(response)
            });

            if (response.success) {
                // 🔧 FIXED: Handle multiple possible response structures
                let bookingsList: Booking[] = [];

                // Try different possible response structures
                if (response.data?.bookings && Array.isArray(response.data.bookings)) {
                    bookingsList = response.data.bookings;
                } else if (response.data && Array.isArray(response.data)) {
                    bookingsList = response.data;
                } else if (response.bookings && Array.isArray(response.bookings)) {
                    bookingsList = response.bookings;
                } else if (Array.isArray(response)) {
                    bookingsList = response;
                } else {
                    console.warn('⚠️ Unexpected bookings response structure:', response);
                    bookingsList = [];
                }

                console.log('📋 Processed bookings:', {
                    count: bookingsList.length,
                    firstBooking: bookingsList[0] ? {
                        id: bookingsList[0].id,
                        status: bookingsList[0].status,
                        hasTrip: !!bookingsList[0].trip
                    } : null
                });

                setBookings(bookingsList);
                calculateStats(bookingsList);

                // Only show error if we got success but no bookings when we expected some
                if (bookingsList.length === 0) {
                    console.log('ℹ️ No bookings found (this might be normal for new users)');
                }
            } else {
                // API returned success: false
                const errorMessage = response.message || 'Failed to load bookings';
                console.error('❌ Bookings API error:', errorMessage);
                setError(errorMessage);
                setBookings([]);
                setStats({
                    total: 0,
                    pending: 0,
                    confirmed: 0,
                    completed: 0,
                    cancelled: 0,
                });
            }
        } catch (err: any) {
            console.error('❌ Error fetching bookings:', {
                message: err.message,
                status: err.response?.status,
                responseData: err.response?.data
            });

            // 🔧 FIXED: More specific error messages
            let errorMessage = 'Failed to load bookings. Please try again.';

            if (err.response?.status === 401) {
                errorMessage = 'Authentication failed. Please log in again.';
            } else if (err.response?.status === 403) {
                errorMessage = 'Access denied. Please check your permissions.';
            } else if (err.response?.status >= 500) {
                errorMessage = 'Server error. Please try again in a few minutes.';
            } else if (!err.response) {
                errorMessage = 'Network error. Please check your connection.';
            }

            setError(errorMessage);
            setBookings([]);
            setStats({
                total: 0,
                pending: 0,
                confirmed: 0,
                completed: 0,
                cancelled: 0,
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Calculate booking statistics
    const calculateStats = useCallback((bookingsList: Booking[]) => {
        const newStats = {
            total: bookingsList.length,
            pending: bookingsList.filter(b => b.status === 'pending').length,
            confirmed: bookingsList.filter(b => b.status === 'confirmed').length,
            completed: bookingsList.filter(b => b.status === 'completed').length,
            cancelled: bookingsList.filter(b => b.status === 'cancelled').length,
        };
        setStats(newStats);
        console.log('📊 Booking stats calculated:', newStats);
    }, []);

    // Filter bookings based on selected filter
    useEffect(() => {
        if (selectedFilter === 'all') {
            setFilteredBookings(bookings);
        } else {
            setFilteredBookings(bookings.filter(booking => booking.status === selectedFilter));
        }
    }, [bookings, selectedFilter]);

    // Initial load
    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // Handle booking selection
    const handleBookingPress = useCallback((booking: Booking) => {
        router.push({
            pathname: '/(passenger)/bookings/[id]',
            params: {
                id: booking.id,
                bookingData: JSON.stringify(booking)
            }
        });
    }, [router]);

    // Handle booking actions
    const handleBookingAction = useCallback((booking: Booking, action: 'cancel' | 'retry_payment' | 'view_trip') => {
        switch (action) {
            case 'cancel':
                Alert.alert(
                    'Cancel Booking',
                    `Are you sure you want to cancel booking ${booking.bookingReference}?`,
                    [
                        { text: 'No', style: 'cancel' },
                        {
                            text: 'Yes, Cancel',
                            style: 'destructive',
                            onPress: () => {
                                // TODO: Implement cancel booking
                                Alert.alert('Info', 'Cancel booking functionality coming soon');
                            }
                        }
                    ]
                );
                break;

            case 'retry_payment':
                router.push({
                    pathname: '/(passenger)/payment',
                    params: {
                        bookingId: booking.id,
                        amount: booking.amount?.toString() || '0',
                        bookingReference: booking.bookingReference,
                    }
                });
                break;

            case 'view_trip':
                if (booking.trip) {
                    Alert.alert('Trip Details', `Trip from ${booking.trip.route?.startStation?.name} to ${booking.trip.route?.endStation?.name}`);
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

    // Render booking item
    const renderBookingItem = useCallback(({ item }: { item: Booking }) => (
        <BookingCard
            booking={item}
            onPress={() => handleBookingPress(item)}
            onAction={(action) => handleBookingAction(item, action)}
        />
    ), [handleBookingPress, handleBookingAction]);

    // 🔧 FIXED: Better loading state handling
    if (loading && bookings.length === 0 && !error) {
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

    // 🔧 FIXED: Better error state handling
    if (error && bookings.length === 0) {
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