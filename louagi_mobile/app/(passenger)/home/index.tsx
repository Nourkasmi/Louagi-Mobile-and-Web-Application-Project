// app/(passenger)/home/index.tsx - UPDATED: Direct Navigation to Station Search
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

  // 🔧 UPDATED: Direct navigation to station search
  const handleSearchTrips = () => {
    router.push('/(passenger)/search');
  };

  // 🔧 UPDATED: Quick station selection
  const handleQuickStationSelect = (station: Station) => {
    router.push({
      pathname: '/(passenger)/search',
      params: {
        selectedStationId: station.id,
        selectedStationName: station.name
      }
    });
  };

  // Render functions
  const renderModernHeader = () => (
    <View style={modernStyles.heroSection}>
      <StatusBar barStyle="light-content" backgroundColor="#0066cc" />

      {/* User greeting */}
      <View style={modernStyles.userGreeting}>
        <View style={modernStyles.greetingContent}>
          <Text style={modernStyles.greeting}>{getGreeting()},</Text>
          <Text style={modernStyles.userName}>{getFirstName()}! 👋</Text>
        </View>

        <View style={modernStyles.headerActions}>
          <TouchableOpacity
            style={modernStyles.profileButton}
            onPress={() => router.push('/(passenger)/profile')}
          >
            <View style={modernStyles.avatar}>
              <Text style={modernStyles.avatarText}>
                {auth.user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={modernStyles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔧 UPDATED: Enhanced Search Section */}
      <View style={modernStyles.searchSection}>
        <Text style={modernStyles.searchTitle}>Where are you going?</Text>
        <Text style={modernStyles.searchSubtitle}>Find trips across Tunisia</Text>

        <TouchableOpacity
          style={modernStyles.searchButton}
          onPress={handleSearchTrips}
          activeOpacity={0.9}
        >
          <MaterialIcons name="search" size={24} color="#0066cc" />
          <Text style={modernStyles.searchButtonText}>Search stations & destinations</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#0066cc" />
        </TouchableOpacity>

        {/* 🆕 NEW: Quick Action Buttons */}
        <View style={modernStyles.quickActionsRow}>
          <TouchableOpacity
            style={modernStyles.quickAction}
            onPress={() => router.push('/(passenger)/bookings')}
          >
            <MaterialIcons name="history" size={20} color="#ffffff" />
            <Text style={modernStyles.quickActionText}>My Trips</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={modernStyles.quickAction}
            onPress={() => router.push('/(passenger)/search')}
          >
            <MaterialIcons name="directions" size={20} color="#ffffff" />
            <Text style={modernStyles.quickActionText}>Find Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={modernStyles.quickAction}
            onPress={() => Alert.alert('Support', 'Contact: support@louagi.com')}
          >
            <MaterialIcons name="help-outline" size={20} color="#ffffff" />
            <Text style={modernStyles.quickActionText}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick stats */}
      <View style={modernStyles.statsRow}>
        <View style={modernStyles.statItem}>
          <MaterialIcons name="directions-bus" size={20} color="#ffffff" />
          <Text style={modernStyles.statNumber}>{quickStats.totalTrips}</Text>
          <Text style={modernStyles.statLabel}>Trips</Text>
        </View>

        <View style={modernStyles.statItem}>
          <MaterialIcons name="savings" size={20} color="#ffffff" />
          <Text style={modernStyles.statNumber}>${quickStats.savedAmount}</Text>
          <Text style={modernStyles.statLabel}>Saved</Text>
        </View>

        <View style={modernStyles.statItem}>
          <MaterialIcons name="schedule" size={20} color="#ffffff" />
          <Text style={modernStyles.statNumber}>{quickStats.pendingPayments}</Text>
          <Text style={modernStyles.statLabel}>Pending</Text>
        </View>
      </View>
    </View>
  );

  const renderNextTrip = () => {
    if (!quickStats.nextTrip) return null;

    const trip = quickStats.nextTrip;
    return (
      <View style={modernStyles.section}>
        <Text style={modernStyles.sectionTitle}>🎫 Your Next Trip</Text>

        <TouchableOpacity
          style={modernStyles.nextTripCard}
          onPress={() => handleBookingPress(trip)}
        >
          <View style={modernStyles.tripHeader}>
            <View style={modernStyles.routeInfo}>
              <Text style={modernStyles.routeText}>
                {trip.trip?.route?.startStation?.name || 'Departure'} → {trip.trip?.route?.endStation?.name || 'Destination'}
              </Text>
              <Text style={modernStyles.tripTime}>
                {trip.trip?.departureTime ? formatTime(trip.trip.departureTime) : 'When full'} • {trip.trip?.departureTime ? formatDate(trip.trip.departureTime) : 'Today'}
              </Text>
            </View>

            <View style={modernStyles.tripBadge}>
              <Text style={modernStyles.tripBadgeText}>Confirmed</Text>
            </View>
          </View>

          <View style={modernStyles.tripDetails}>
            <View style={modernStyles.tripDetailItem}>
              <MaterialIcons name="people" size={16} color="#666" />
              <Text style={modernStyles.tripDetailText}>{trip.seats} seat{trip.seats > 1 ? 's' : ''}</Text>
            </View>

            <View style={modernStyles.tripDetailItem}>
              <MaterialIcons name="payment" size={16} color="#666" />
              <Text style={modernStyles.tripDetailText}>${trip.amount || '0.00'}</Text>
            </View>

            <View style={modernStyles.tripDetailItem}>
              <MaterialIcons name="confirmation-number" size={16} color="#666" />
              <Text style={modernStyles.tripDetailText}>#{trip.bookingReference}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecentBookings = () => {
    if (recentBookings.length === 0) return null;

    return (
      <View style={modernStyles.section}>
        <View style={modernStyles.sectionHeader}>
          <Text style={modernStyles.sectionTitle}>📋 Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(passenger)/bookings')}>
            <Text style={modernStyles.seeAllLink}>View all</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.map((booking, index) => (
          <TouchableOpacity
            key={booking.id}
            style={modernStyles.activityCard}
            onPress={() => handleBookingPress(booking)}
          >
            <View style={modernStyles.activityContent}>
              <View style={modernStyles.bookingRoute}>
                <Text style={modernStyles.activityTitle}>
                  {booking.trip?.route?.startStation?.name || 'Unknown'} → {booking.trip?.route?.endStation?.name || 'Unknown'}
                </Text>
                <Text style={modernStyles.activitySubtitle}>
                  {formatDate(booking.trip?.departureTime || booking.createdAt)} • {booking.seats} seat{booking.seats > 1 ? 's' : ''}
                </Text>
              </View>

              <View style={modernStyles.bookingStatus}>
                <View style={[modernStyles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                <Text style={modernStyles.bookingAmount}>${booking.amount || '0.00'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderStationItem = ({ item, index }: { item: Station; index: number }) => (
    <TouchableOpacity
      style={[
        modernStyles.stationCard,
        index % 2 === 0 ? modernStyles.stationCardLeft : modernStyles.stationCardRight
      ]}
      onPress={() => handleQuickStationSelect(item)}
    >
      <View style={modernStyles.stationIcon}>
        <MaterialIcons name="location-on" size={24} color="#0066cc" />
      </View>

      <View style={modernStyles.stationInfo}>
        <Text style={modernStyles.stationName} numberOfLines={1}>{item.name}</Text>
        <Text style={modernStyles.stationLocation} numberOfLines={1}>
          {item.city}, {item.state}
        </Text>

        {item.amenities && Object.keys(item.amenities).length > 0 && (
          <View style={modernStyles.amenitiesIndicator}>
            <MaterialIcons name="star" size={12} color="#ffc107" />
            <Text style={modernStyles.amenitiesText}>Amenities</Text>
          </View>
        )}
      </View>

      <MaterialIcons name="arrow-forward-ios" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': '#ff9800',
      'confirmed': '#4caf50',
      'completed': '#2196f3',
      'cancelled': '#f44336',
    };
    return colors[status as keyof typeof colors] || '#9e9e9e';
  };

  // Loading state
  if (loading && stations.length === 0) {
    return (
      <View style={styles.container}>
        {renderModernHeader()}
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
        {renderModernHeader()}
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
        {renderModernHeader()}
        {renderNextTrip()}
        {renderRecentBookings()}

        {/* 🔧 UPDATED: Popular Destinations Section */}
        <View style={modernStyles.section}>
          <View style={modernStyles.sectionHeader}>
            <Text style={modernStyles.sectionTitle}>🌟 Quick Station Access</Text>
            <TouchableOpacity onPress={() => router.push('/(passenger)/search')}>
              <Text style={modernStyles.seeAllLink}>View all ({stations.length})</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={stations.slice(0, 6)} // Show only first 6 stations
            keyExtractor={(item) => item.id}
            renderItem={renderStationItem}
            scrollEnabled={false}
            numColumns={2}
            columnWrapperStyle={stations.length > 1 ? modernStyles.stationRow : undefined}
            contentContainerStyle={modernStyles.stationsList}
            ListEmptyComponent={
              <View style={modernStyles.emptyState}>
                <MaterialIcons name="location-off" size={48} color="#ccc" />
                <Text style={modernStyles.emptyText}>No stations available</Text>
                <Text style={modernStyles.emptySubtext}>Pull to refresh</Text>
              </View>
            }
          />

          {/* 🆕 NEW: Search All Stations Button */}
          {stations.length > 6 && (
            <TouchableOpacity
              style={modernStyles.searchAllButton}
              onPress={() => router.push('/(passenger)/search')}
            >
              <MaterialIcons name="search" size={20} color="#0066cc" />
              <Text style={modernStyles.searchAllButtonText}>
                Search all {stations.length} stations
              </Text>
              <MaterialIcons name="arrow-forward" size={16} color="#0066cc" />
            </TouchableOpacity>
          )}
        </View>

        {/* App info footer */}
        <View style={modernStyles.footer}>
          <Text style={modernStyles.footerText}>
            Louagi • Fast, reliable shared transportation
          </Text>
          <Text style={modernStyles.versionText}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// 🔧 UPDATED: Enhanced modern styles
const modernStyles = {
  // Hero Section
  heroSection: {
    backgroundColor: '#0066cc',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },

  userGreeting: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 30,
  },

  greetingContent: {
    flex: 1,
  },

  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },

  userName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#ffffff',
  },

  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },

  profileButton: {
    padding: 4,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },

  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // 🔧 UPDATED: Enhanced Search Section
  searchSection: {
    alignItems: 'center' as const,
    marginBottom: 30,
  },

  searchTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center' as const,
  },

  searchSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    textAlign: 'center' as const,
  },

  searchButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    gap: 12,
    marginBottom: 20,
  },

  searchButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0066cc',
    flex: 1,
  },

  // 🆕 NEW: Quick Actions Row
  quickActionsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    width: '100%',
    gap: 12,
  },

  quickAction: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center' as const,
    gap: 6,
  },

  quickActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff',
  },

  // Stats
  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
  },

  statItem: {
    alignItems: 'center' as const,
    gap: 8,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ffffff',
  },

  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center' as const,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#333',
  },

  seeAllLink: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600' as const,
  },

  // Next Trip
  nextTripCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  tripHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },

  routeInfo: {
    flex: 1,
  },

  routeText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },

  tripTime: {
    fontSize: 14,
    color: '#666',
  },

  tripBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  tripBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#28a745',
  },

  tripDetails: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },

  tripDetailItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },

  tripDetailText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500' as const,
  },

  // Activity Cards
  activityCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  activityContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },

  bookingRoute: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },

  activitySubtitle: {
    fontSize: 14,
    color: '#666',
  },

  bookingStatus: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  bookingAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
  },

  // Stations
  stationsList: {
    paddingBottom: 8,
  },

  stationRow: {
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },

  stationCard: {
    backgroundColor: '#ffffff',
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  stationCardLeft: {
    marginRight: 6,
  },

  stationCardRight: {
    marginLeft: 6,
  },

  stationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },

  stationInfo: {
    flex: 1,
  },

  stationName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 2,
  },

  stationLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  amenitiesIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
  },

  amenitiesText: {
    fontSize: 10,
    color: '#ffc107',
    fontWeight: '500' as const,
  },

  // 🆕 NEW: Search All Button
  searchAllButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#0066cc',
    gap: 8,
  },

  searchAllButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0066cc',
  },

  // Empty states
  emptyState: {
    alignItems: 'center' as const,
    padding: 40,
  },

  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#666',
    marginTop: 16,
    marginBottom: 4,
    textAlign: 'center' as const,
  },

  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center' as const,
  },

  // Footer
  footer: {
    alignItems: 'center' as const,
    padding: 24,
    paddingBottom: 40,
  },

  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },

  versionText: {
    fontSize: 12,
    color: '#999',
  },
};