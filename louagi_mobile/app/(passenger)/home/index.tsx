// 📁 app/(passenger)/home/index.tsx - ENHANCED Home Screen with Modern UX
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { logout } from '../../../src/store/authSlice';
import { getStations, getMyBookings, type Station, type Booking } from '../../../src/services/api';
import { RootState } from '../../../src/store/store';
import { styles } from './index.styles';

const { width } = Dimensions.get('window');

export default function PassengerHomeScreen() {
  // State management
  const [stations, setStations] = useState<Station[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickStats, setQuickStats] = useState({
    totalTrips: 0,
    pendingPayments: 0,
    nextTrip: null as Booking | null,
    savedAmount: 0,
  });

  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  // Helper functions
  const getFirstName = useCallback(() => {
    if (auth.user?.username) {
      return auth.user.username.split(' ')[0];
    }
    return 'Traveler';
  }, [auth.user?.username]);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const formatTime = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid time';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
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
      return 'Invalid date';
    }
  }, []);

  // Fetch all data
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      // Fetch stations and recent bookings in parallel
      const [stationsResponse, bookingsResponse] = await Promise.all([
        getStations({ limit: 12 }),
        getMyBookings({ limit: 5 }),
      ]);

      // Handle stations
      if (stationsResponse.success) {
        const stationsData = stationsResponse.data?.stations || stationsResponse.stations || [];
        setStations(stationsData);
      }

      // Handle bookings and calculate stats
      if (bookingsResponse.success) {
        const bookingsData = bookingsResponse.data?.bookings || [];
        setRecentBookings(bookingsData.slice(0, 3)); // Show only 3 recent

        // Calculate enhanced stats
        const completedTrips = bookingsData.filter(b => b.status === 'completed').length;
        const pendingCount = bookingsData.filter(b => b.status === 'pending').length;
        const savedAmount = bookingsData
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.amount || 0), 0) * 0.25; // Assume 25% savings vs alternatives

        const nextTrip = bookingsData
          .filter(b => b.status === 'confirmed' && b.trip?.departureTime)
          .sort((a, b) => new Date(a.trip!.departureTime).getTime() - new Date(b.trip!.departureTime).getTime())[0] || null;

        setQuickStats({
          totalTrips: completedTrips,
          pendingPayments: pendingCount,
          nextTrip,
          savedAmount: Math.round(savedAmount),
        });
      }

      if (!stationsResponse.success || stations.length === 0) {
        setError('No stations available at the moment');
      }
    } catch (err: any) {
      console.error('Error fetching home data:', err);
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Navigation handlers
  const handleStationSelect = useCallback((station: Station) => {
    router.push({
      pathname: '/(passenger)/search',
      params: {
        stationId: station.id,
        stationName: station.name
      }
    });
  }, [router]);

  const handleBookingPress = useCallback((booking: Booking) => {
    router.push({
      pathname: '/(passenger)/bookings/[id]',
      params: {
        id: booking.id,
        bookingData: JSON.stringify(booking)
      }
    });
  }, [router]);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('louagi_token');
              global.authToken = undefined;
              dispatch(logout());
              router.replace('/login');
            } catch (error) {
              dispatch(logout());
              router.replace('/login');
            }
          }
        }
      ]
    );
  };

  // Quick action handlers
  const handleQuickBook = () => {
    if (stations.length > 0) {
      // Go to most popular station (first one)
      handleStationSelect(stations[0]);
    } else {
      Alert.alert('No Stations', 'No departure stations are currently available.');
    }
  };

  const handleViewAllStations = () => {
    // You could create a dedicated all stations screen or show current list
    Alert.alert('All Stations', `Showing ${stations.length} available stations below.`);
  };

  // Render functions
  const renderHeader = () => (
    <View style={styles.header}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* User greeting and profile */}
      <View style={styles.userSection}>
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{getFirstName()}! 👋</Text>
        </View>

        <View style={styles.profileActions}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(passenger)/profile')}
          >
            <MaterialIcons name="account-circle" size={32} color="#0066cc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#dc3545" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="directions-bus" size={24} color="#0066cc" />
          <Text style={styles.statNumber}>{quickStats.totalTrips}</Text>
          <Text style={styles.statLabel}>Trips</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="savings" size={24} color="#28a745" />
          <Text style={styles.statNumber}>${quickStats.savedAmount}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>

        <View style={styles.statCard}>
          <MaterialIcons name="schedule" size={24} color="#ff9800" />
          <Text style={styles.statNumber}>{quickStats.pendingPayments}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.quickActionCard} onPress={handleQuickBook}>
          <View style={[styles.quickActionIcon, { backgroundColor: '#e3f2fd' }]}>
            <MaterialIcons name="add-location" size={28} color="#0066cc" />
          </View>
          <Text style={styles.quickActionTitle}>Book Trip</Text>
          <Text style={styles.quickActionSubtitle}>Find & book your ride</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push('/(passenger)/bookings')}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#fff3cd' }]}>
            <MaterialIcons name="receipt-long" size={28} color="#ff9800" />
          </View>
          <Text style={styles.quickActionTitle}>My Trips</Text>
          <Text style={styles.quickActionSubtitle}>View your bookings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNextTrip = () => {
    if (!quickStats.nextTrip) return null;

    const trip = quickStats.nextTrip;
    return (
      <View style={styles.nextTripContainer}>
        <Text style={styles.sectionTitle}>Your Next Trip</Text>

        <TouchableOpacity
          style={styles.nextTripCard}
          onPress={() => handleBookingPress(trip)}
        >
          <View style={styles.nextTripHeader}>
            <View style={styles.routeInfo}>
              <Text style={styles.routeText}>
                {trip.trip?.route?.startStation?.name || 'Departure'} → {trip.trip?.route?.endStation?.name || 'Destination'}
              </Text>
              <Text style={styles.nextTripTime}>
                {trip.trip?.departureTime ? formatTime(trip.trip.departureTime) : 'When full'} • {trip.trip?.departureTime ? formatDate(trip.trip.departureTime) : 'Today'}
              </Text>
            </View>

            <View style={styles.tripStatusBadge}>
              <Text style={styles.tripStatusText}>Confirmed</Text>
            </View>
          </View>

          <View style={styles.nextTripDetails}>
            <View style={styles.tripDetailItem}>
              <MaterialIcons name="people" size={16} color="#666" />
              <Text style={styles.tripDetailText}>{trip.seats} seat{trip.seats > 1 ? 's' : ''}</Text>
            </View>

            <View style={styles.tripDetailItem}>
              <MaterialIcons name="payment" size={16} color="#666" />
              <Text style={styles.tripDetailText}>${trip.amount || '0.00'}</Text>
            </View>

            <View style={styles.tripDetailItem}>
              <MaterialIcons name="confirmation-number" size={16} color="#666" />
              <Text style={styles.tripDetailText}>#{trip.bookingReference}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecentBookings = () => {
    if (recentBookings.length === 0) return null;

    return (
      <View style={styles.recentBookingsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          <TouchableOpacity onPress={() => router.push('/(passenger)/bookings')}>
            <Text style={styles.seeAllLink}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.map((booking, index) => (
          <TouchableOpacity
            key={booking.id}
            style={styles.recentBookingCard}
            onPress={() => handleBookingPress(booking)}
          >
            <View style={styles.bookingCardContent}>
              <View style={styles.bookingRoute}>
                <Text style={styles.bookingRouteText}>
                  {booking.trip?.route?.startStation?.name || 'Unknown'} → {booking.trip?.route?.endStation?.name || 'Unknown'}
                </Text>
                <Text style={styles.bookingDate}>
                  {formatDate(booking.trip?.departureTime || booking.createdAt)}
                </Text>
              </View>

              <View style={styles.bookingStatusContainer}>
                <View style={[
                  styles.bookingStatusDot,
                  { backgroundColor: getStatusColor(booking.status) }
                ]} />
                <Text style={styles.bookingAmount}>${booking.amount || '0.00'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': '#ff9800',
      'confirmed': '#4caf50',
      'completed': '#2196f3',
      'cancelled': '#f44336',
    };
    return colors[status as keyof typeof colors] || '#9e9e9e';
  };

  const renderStationItem = ({ item, index }: { item: Station; index: number }) => (
    <TouchableOpacity
      style={[
        styles.stationCard,
        index % 2 === 0 ? styles.stationCardLeft : styles.stationCardRight
      ]}
      onPress={() => handleStationSelect(item)}
    >
      <View style={styles.stationIconContainer}>
        <MaterialIcons name="location-on" size={24} color="#0066cc" />
      </View>

      <View style={styles.stationInfo}>
        <Text style={styles.stationName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.stationLocation} numberOfLines={1}>
          {item.city}, {item.state}
        </Text>

        {item.amenities && Object.keys(item.amenities).length > 0 && (
          <View style={styles.amenitiesIndicator}>
            <MaterialIcons name="star" size={12} color="#ffc107" />
            <Text style={styles.amenitiesText}>Amenities</Text>
          </View>
        )}
      </View>

      <MaterialIcons name="arrow-forward-ios" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  // Loading state
  if (loading && stations.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && stations.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={64} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
            <Text style={styles.retryButtonText}>🔄 Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            colors={['#0066cc']}
            tintColor="#0066cc"
          />
        }
      >
        {renderHeader()}
        {renderQuickActions()}
        {renderNextTrip()}
        {renderRecentBookings()}

        {/* Departure Stations */}
        <View style={styles.stationsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Departure Stations</Text>
            <TouchableOpacity onPress={handleViewAllStations}>
              <Text style={styles.seeAllLink}>View all ({stations.length})</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={stations}
            keyExtractor={(item) => item.id}
            renderItem={renderStationItem}
            scrollEnabled={false}
            numColumns={2}
            columnWrapperStyle={styles.stationRow}
            contentContainerStyle={styles.stationsList}
            ListEmptyComponent={
              <View style={styles.emptyStations}>
                <MaterialIcons name="location-off" size={48} color="#ccc" />
                <Text style={styles.emptyStationsText}>No stations available</Text>
                <Text style={styles.emptyStationsSubtext}>Pull to refresh</Text>
              </View>
            }
          />
        </View>

        {/* App info footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Louagi • Fast, reliable shared transportation
          </Text>
          <Text style={styles.versionText}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}