// app/(tabs)/passenger/BookingHistoryScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getMyBookings, cancelBooking, type Booking } from '../../../src/services/api';

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function BookingHistoryScreen() {
  const router = useRouter();
  
  // State management
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch bookings
  const fetchBookings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }

      const response = await getMyBookings({
        status: activeFilter === 'all' ? undefined : activeFilter,
        page: isRefresh ? 1 : page,
        limit: 10,
      });

      if (response.success) {
        const newBookings = response.bookings || [];
        
        if (isRefresh || page === 1) {
          setBookings(newBookings);
        } else {
          setBookings(prev => [...prev, ...newBookings]);
        }
        
        setHasMore(newBookings.length === 10);
        if (!isRefresh) setPage(prev => prev + 1);
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
  }, [activeFilter, page]);

  // Initial load
  useEffect(() => {
    fetchBookings(true);
  }, [activeFilter]);

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setPage(1);
    setBookings([]);
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
                fetchBookings(true);
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
    
    return hoursUntilDeparture > 1; // Can cancel if more than 1 hour before departure
  };

  // Render booking item
  const renderBookingItem = ({ item }: { item: Booking }) => {
    const { date, time } = formatDateTime(item.trip.departureTime);
    const statusColor = getStatusColor(item.status);
    const canCancel = canCancelBooking(item);

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => {
          // For now, just show an alert with booking details
          // Later you can create a BookingDetailScreen
          Alert.alert(
            'Booking Details',
            `Reference: ${item.bookingReference}\nRoute: ${item.trip.route.description}\nSeats: ${item.seats}\nAmount: $${item.amount}\nStatus: ${getStatusText(item.status)}`
          );
        }}
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
            onRefresh={() => fetchBookings(true)}
            colors={['#0066cc']}
          />
        }
        onEndReached={() => {
          if (hasMore && !loading) {
            fetchBookings();
          }
        }}
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
              onPress={() => router.push('/(tabs)/passenger/HomeScreen')}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#0066cc',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  bookingCard: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  bookingDetails: {
    marginBottom: 8,
  },
  bookingReference: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0066cc',
    marginBottom: 2,
  },
  dateTime: {
    fontSize: 14,
    color: '#666',
  },
  tripInfo: {
    marginBottom: 8,
  },
  routeDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  seatInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  driverInfo: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  exploreButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});