// app/(passenger)/bookings/index.tsx - Main Bookings Screen
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

    // Fetch bookings
    const fetchBookings = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError(null);

            const response = await getMyBookings({
                limit: 50,
                page: 1,
            });

            if (response.success && response.data) {
                const bookingsList = response.data.bookings || [];
                setBookings(bookingsList);
                calculateStats(bookingsList);

                console.log('📋 Fetched bookings:', {
                    count: bookingsList.length,
                    hasData: response.data,
                    summary: response.data.summary
                });
            } else {
                setError(response.message || 'Failed to load bookings');
                setBookings([]);
            }
        } catch (err: any) {
            console.error('❌ Error fetching bookings:', err);
            setError('Failed to load bookings. Please try again.');
            setBookings([]);
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

    // Loading state
    if (loading && bookings.length === 0) {
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