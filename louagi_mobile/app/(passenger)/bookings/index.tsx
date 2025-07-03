// 📁 app/(passenger)/bookings/index.tsx - UPDATED (Clean Logic Only)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getMyBookings, cancelBooking, type Booking } from '../../../src/services/api';
import { styles } from './index.styles'; // 🆕 Import styles

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function PassengerBookingsScreen() {
  const router = useRouter();

  // State management
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // DEBUG: log whenever state changes
  useEffect(() => {
  }, [bookings, loading, refreshing, activeFilter, page, hasMore]);

  // Fetch bookings (logs included)
  const fetchBookings = async (pageNumber = 1, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getMyBookings({
        status: activeFilter === 'all' ? undefined : activeFilter,
        page: pageNumber,
        limit: 10,
      });

      if (response.success && response.data) {
        const newBookings = response.data.bookings || [];
        if (pageNumber === 1) {
          setBookings(newBookings);
        } else {
          setBookings(prev => {
            const updated = [...prev, ...newBookings];
            return updated;
          });
        }
        setHasMore(newBookings.length === 10);
      } else {
        Alert.alert('Error', 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Effect: On filter change, reset everything and fetch first page
  useEffect(() => {
    setPage(1);
    setBookings([]);
    fetchBookings(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  // Pagination: load more bookings
  const handleLoadMore = () => {
  if (!loading && hasMore && bookings.length > 0) {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBookings(nextPage);
  }
};

  // Pull to refresh
  const handleRefresh = () => {
    setPage(1);
    fetchBookings(1, true);
  };

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  // Handle cancel booking
  const handleCancelBooking = async (booking: Booking) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking for ${booking.trip.route.description}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cancelBooking(booking.id, 'Cancelled by passenger');
              if (response.success) {
                Alert.alert('Success', 'Booking cancelled successfully');
                handleRefresh(); // Use pull-to-refresh logic to reload from page 1
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel booking');
              }
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'confirmed': return '#4caf50';
      case 'completed': return '#2196f3';
      case 'cancelled': return '#f44336';
      case 'no_show': return '#9e9e9e';
      default: return '#666';
    }
  };

  // Get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'no_show': return 'No Show';
      default: return status;
    }
  };

  // Check if booking can be cancelled
  const canCancelBooking = (booking: Booking) => {
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return false;
    }
    const departureTime = new Date(booking.trip.departureTime);
    const now = new Date();
    const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilDeparture > 1;
  };

  // Navigate to booking details
  const viewBookingDetails = (booking: Booking) => {
    router.push({
      pathname: '/(passenger)/bookings/[id]',
      params: {
        id: booking.id,
        bookingData: JSON.stringify(booking)
      }
    });
  };

  // Render booking item
  const renderBookingItem = ({ item }: { item: Booking }) => {
    const { date, time } = formatDateTime(item.trip.departureTime);
    const statusColor = getStatusColor(item.status);
    const canCancel = canCancelBooking(item);

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => viewBookingDetails(item)}
      >
        <View style={styles.bookingHeader}>
          <Text style={styles.routeText}>{item.trip.route.description}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <Text style={styles.bookingReference}>#{item.bookingReference}</Text>
          <Text style={styles.dateTime}>{date} at {time}</Text>
        </View>

        <View style={styles.tripInfo}>
          <Text style={styles.routeDetails}>
            {item.trip.route.startStation.name} → {item.trip.route.endStation.name}
          </Text>
          <Text style={styles.seatInfo}>
            {item.seats} seat{item.seats > 1 ? 's' : ''} • ${item.amount}
          </Text>
        </View>

        {item.trip.driver && (
          <Text style={styles.driverInfo}>
            Driver: {item.trip.driver.user.username} ⭐ {item.trip.driver.rating.toFixed(1)}
          </Text>
        )}

        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item)}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.viewDetailsButton}>
          <Text style={styles.viewDetailsText}>View Details →</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Filter buttons
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // Calculate summary stats
  const summaryStats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    totalSpent: bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, booking) => sum + parseFloat(booking.amount.toString()), 0),
  };

  if (loading && bookings.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
        <TouchableOpacity
          onPress={() => router.push('/(passenger)/home')}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{summaryStats.total}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{summaryStats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>${summaryStats.totalSpent.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {summaryStats.pending + summaryStats.confirmed}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === item.key && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange(item.key)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === item.key && styles.filterButtonTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Bookings List */}
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0066cc']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loading && bookings.length > 0 ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color="#0066cc" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No bookings found</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === 'all'
                ? 'You haven\'t made any bookings yet'
                : `No ${activeFilter} bookings found`
              }
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/(passenger)/home')}
            >
              <Text style={styles.exploreButtonText}>Explore Trips</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={bookings.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}