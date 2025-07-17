// app/(passenger)/home/index.tsx - ENHANCED VERSION with Beautiful Welcome Card
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { logout } from '../../../src/store/authSlice';
import {
  getStations,
  getMyBookings,
  getPassengerAnalytics,
  type Station,
  type Booking
} from '../../../src/services/api';
import { RootState } from '../../../src/store/store';
import { WelcomeCard } from './components/WelcomeCard';
import { styles } from './index.styles';

const { width, height } = Dimensions.get('window');

// Enhanced Analytics Interface
interface EnhancedAnalytics {
  totalTrips: number;
  completedTrips: number;
  pendingPayments: number;
  totalSpent: number;
  averagePerTrip: number;
  monthlySpending: Array<{ month: string; amount: number }>;
  favoriteRoute: string;
  timesSaved: number; // hours saved vs other transport
  co2Saved: number; // kg CO2 saved
  successRate: number; // completion rate
}

// Quick Action Interface
interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
  badge?: number;
  disabled?: boolean;
}

export default function EnhancedPassengerHomeScreen() {
  // State management
  const [stations, setStations] = useState<Station[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [nextTrip, setNextTrip] = useState<Booking | null>(null);
  const [analytics, setAnalytics] = useState<EnhancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headerAnimatedValue] = useState(new Animated.Value(0));

  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  // Memoized computed values
  const firstName = useMemo(() => {
    return auth.user?.username?.split(' ')[0] || 'Traveler';
  }, [auth.user?.username]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const isNewUser = useMemo(() => {
    return analytics?.totalTrips === 0;
  }, [analytics?.totalTrips]);

  // Enhanced data fetching with real analytics
  const fetchEnhancedData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      // Parallel data fetching for better performance
      const [stationsResponse, bookingsResponse, analyticsResponse] = await Promise.allSettled([
        getStations({ limit: 12 }),
        getMyBookings({ limit: 10 }),
        getPassengerAnalytics(6) // Last 6 months
      ]);

      // Process stations
      if (stationsResponse.status === 'fulfilled' && stationsResponse.value.success) {
        const stationsData = stationsResponse.value.data?.stations || [];
        setStations(stationsData);
      }

      // Process bookings and extract insights
      let enhancedAnalytics: EnhancedAnalytics = {
        totalTrips: 0,
        completedTrips: 0,
        pendingPayments: 0,
        totalSpent: 0,
        averagePerTrip: 0,
        monthlySpending: [],
        favoriteRoute: '',
        timesSaved: 0,
        co2Saved: 0,
        successRate: 0
      };

      if (bookingsResponse.status === 'fulfilled' && bookingsResponse.value.success) {
        const bookingsData = bookingsResponse.value.data?.bookings || [];
        setRecentBookings(bookingsData.slice(0, 3));

        // Find next upcoming trip
        const upcomingTrips = bookingsData
          .filter(b => b.status === 'confirmed' && b.trip?.departureTime)
          .sort((a, b) => new Date(a.trip!.departureTime).getTime() - new Date(b.trip!.departureTime).getTime());

        setNextTrip(upcomingTrips[0] || null);

        // Calculate enhanced analytics
        const completed = bookingsData.filter(b => b.status === 'completed');
        const pending = bookingsData.filter(b => b.paymentStatus === 'pending');

        enhancedAnalytics = {
          totalTrips: bookingsData.length,
          completedTrips: completed.length,
          pendingPayments: pending.length,
          totalSpent: completed.reduce((sum, b) => sum + (b.amount || 0), 0),
          averagePerTrip: completed.length > 0 ? completed.reduce((sum, b) => sum + (b.amount || 0), 0) / completed.length : 0,
          monthlySpending: calculateMonthlySpending(completed),
          favoriteRoute: calculateFavoriteRoute(completed),
          timesSaved: completed.length * 0.75, // Assume 45min saved per trip
          co2Saved: completed.length * 2.3, // Assume 2.3kg CO2 saved per trip
          successRate: bookingsData.length > 0 ? (completed.length / bookingsData.length) * 100 : 0
        };
      }

      // Use API analytics if available, otherwise use calculated
      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value.success) {
        const apiAnalytics = analyticsResponse.value.data?.analytics?.summary;
        if (apiAnalytics) {
          enhancedAnalytics = {
            ...enhancedAnalytics,
            totalTrips: apiAnalytics.totalBookings || enhancedAnalytics.totalTrips,
            completedTrips: apiAnalytics.completedTrips || enhancedAnalytics.completedTrips,
            totalSpent: apiAnalytics.totalSpent || enhancedAnalytics.totalSpent,
            averagePerTrip: apiAnalytics.averageSpentPerTrip || enhancedAnalytics.averagePerTrip,
          };
        }
      }

      setAnalytics(enhancedAnalytics);

    } catch (err: any) {
      console.error('Error fetching enhanced data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Helper functions for analytics
  const calculateMonthlySpending = (bookings: Booking[]) => {
    const monthly = bookings.reduce((acc, booking) => {
      const month = new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + (booking.amount || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthly)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  const calculateFavoriteRoute = (bookings: Booking[]) => {
    const routes = bookings.reduce((acc, booking) => {
      if (booking.trip?.route) {
        const start = booking.trip.route.startStation?.name || 'Unknown';
        const end = booking.trip.route.endStation?.name || 'Unknown';
        const route = `${start} → ${end}`;
        acc[route] = (acc[route] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const sortedRoutes = Object.entries(routes).sort(([, a], [, b]) => b - a);
    return sortedRoutes.length > 0 ? sortedRoutes[0][0] : 'No trips yet';
  };

  // Quick actions configuration
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'search',
      title: 'Book New Trip',
      subtitle: 'Find available rides',
      icon: 'search',
      color: '#0066cc',
      onPress: () => router.push('/(passenger)/search'),
    },
    {
      id: 'bookings',
      title: 'My Trips',
      subtitle: 'View bookings',
      icon: 'confirmation-number',
      color: '#28a745',
      onPress: () => router.push('/(passenger)/bookings'),
      badge: analytics?.pendingPayments || 0,
    },
    {
      id: 'support',
      title: 'Get Help',
      subtitle: '24/7 support',
      icon: 'help-outline',
      color: '#ff9800',
      onPress: () => Alert.alert('Support', 'Email: support@louagi.com\nPhone: +216 XX XXX XXX'),
    },
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Account settings',
      icon: 'person',
      color: '#6c757d',
      onPress: () => router.push('/(passenger)/profile'),
    },
  ], [analytics?.pendingPayments, router]);

  // Animation for header
  useEffect(() => {
    Animated.timing(headerAnimatedValue, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Initial load
  useEffect(() => {
    fetchEnhancedData();
  }, [fetchEnhancedData]);

  // Navigation handlers
  const handleStationPress = useCallback((station: Station) => {
    router.push({
      pathname: '/(passenger)/search',
      params: {
        selectedStationId: station.id,
        selectedStationName: station.name
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

  const handleLogout = useCallback(() => {
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
  }, [dispatch, router]);

  // Format helpers
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

  // Render Components
  const renderEnhancedHeader = () => (
    <Animated.View style={[
      enhancedStyles.heroSection,
      {
        opacity: headerAnimatedValue,
        transform: [{
          translateY: headerAnimatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          })
        }]
      }
    ]}>
      <StatusBar barStyle="light-content" backgroundColor="#0066cc" />

      {/* User greeting with avatar */}
      <View style={enhancedStyles.userSection}>
        <View style={enhancedStyles.userInfo}>
          <Text style={enhancedStyles.greeting}>{greeting},</Text>
          <Text style={enhancedStyles.userName}>{firstName}! 👋</Text>
          {isNewUser && (
            <Text style={enhancedStyles.newUserBadge}>✨ New Member</Text>
          )}
        </View>

        <View style={enhancedStyles.headerActions}>
          <TouchableOpacity
            style={enhancedStyles.notificationButton}
            onPress={() => Alert.alert('Notifications', 'No new notifications')}
          >
            <MaterialIcons name="notifications-none" size={24} color="#ffffff" />
            {analytics?.pendingPayments ? (
              <View style={enhancedStyles.notificationBadge}>
                <Text style={enhancedStyles.badgeText}>{analytics.pendingPayments}</Text>
              </View>
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            style={enhancedStyles.profileButton}
            onPress={() => router.push('/(passenger)/profile')}
          >
            <View style={enhancedStyles.avatar}>
              <Text style={enhancedStyles.avatarText}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Stats Cards */}
      {analytics && !isNewUser && (
        <View style={enhancedStyles.statsContainer}>
          <View style={enhancedStyles.statCard}>
            <MaterialIcons name="directions-bus" size={20} color="#ffffff" />
            <Text style={enhancedStyles.statNumber}>{analytics.completedTrips}</Text>
            <Text style={enhancedStyles.statLabel}>Trips</Text>
          </View>

          <View style={enhancedStyles.statCard}>
            <MaterialIcons name="eco" size={20} color="#ffffff" />
            <Text style={enhancedStyles.statNumber}>{analytics.co2Saved.toFixed(1)}kg</Text>
            <Text style={enhancedStyles.statLabel}>CO₂ Saved</Text>
          </View>

          <View style={enhancedStyles.statCard}>
            <MaterialIcons name="schedule" size={20} color="#ffffff" />
            <Text style={enhancedStyles.statNumber}>{analytics.timesSaved.toFixed(0)}h</Text>
            <Text style={enhancedStyles.statLabel}>Time Saved</Text>
          </View>

          <View style={enhancedStyles.statCard}>
            <MaterialIcons name="trending-up" size={20} color="#ffffff" />
            <Text style={enhancedStyles.statNumber}>{analytics.successRate.toFixed(0)}%</Text>
            <Text style={enhancedStyles.statLabel}>Success Rate</Text>
          </View>
        </View>
      )}

      {/* Primary Search Action */}
      <TouchableOpacity
        style={enhancedStyles.primarySearchButton}
        onPress={() => router.push('/(passenger)/search')}
        activeOpacity={0.9}
      >
        <MaterialIcons name="search" size={24} color="#0066cc" />
        <Text style={enhancedStyles.searchButtonText}>Where do you want to go?</Text>
        <MaterialIcons name="arrow-forward" size={20} color="#0066cc" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderNextTrip = () => {
    if (!nextTrip) return null;

    return (
      <View style={enhancedStyles.section}>
        <Text style={enhancedStyles.sectionTitle}>🎫 Your Next Trip</Text>

        <TouchableOpacity
          style={enhancedStyles.nextTripCard}
          onPress={() => handleBookingPress(nextTrip)}
        >
          <View style={enhancedStyles.tripHeader}>
            <View style={enhancedStyles.routeInfo}>
              <Text style={enhancedStyles.routeText}>
                {nextTrip.trip?.route?.startStation?.name || 'Departure'} → {nextTrip.trip?.route?.endStation?.name || 'Destination'}
              </Text>
              <Text style={enhancedStyles.tripTime}>
                {nextTrip.trip?.departureTime ? formatTime(nextTrip.trip.departureTime) : 'When full'} • {nextTrip.trip?.departureTime ? formatDate(nextTrip.trip.departureTime) : 'Today'}
              </Text>
            </View>

            <View style={[enhancedStyles.tripBadge, { backgroundColor: '#e8f5e8' }]}>
              <Text style={[enhancedStyles.tripBadgeText, { color: '#28a745' }]}>Confirmed</Text>
            </View>
          </View>

          <View style={enhancedStyles.tripDetails}>
            <View style={enhancedStyles.tripDetailItem}>
              <MaterialIcons name="people" size={16} color="#666" />
              <Text style={enhancedStyles.tripDetailText}>{nextTrip.seats} seat{nextTrip.seats > 1 ? 's' : ''}</Text>
            </View>

            <View style={enhancedStyles.tripDetailItem}>
              <MaterialIcons name="payment" size={16} color="#666" />
              <Text style={enhancedStyles.tripDetailText}>${nextTrip.amount || '0.00'}</Text>
            </View>

            <View style={enhancedStyles.tripDetailItem}>
              <MaterialIcons name="confirmation-number" size={16} color="#666" />
              <Text style={enhancedStyles.tripDetailText}>#{nextTrip.bookingReference}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={enhancedStyles.section}>
      <Text style={enhancedStyles.sectionTitle}>⚡ Quick Actions</Text>

      <View style={enhancedStyles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[enhancedStyles.quickActionCard, { borderLeftColor: action.color }]}
            onPress={action.onPress}
            disabled={action.disabled}
            activeOpacity={0.7}
          >
            <View style={enhancedStyles.actionHeader}>
              <View style={[enhancedStyles.actionIcon, { backgroundColor: action.color }]}>
                <MaterialIcons name={action.icon as any} size={24} color="white" />
              </View>
              {action.badge && action.badge > 0 ? (
                <View style={enhancedStyles.actionBadge}>
                  <Text style={enhancedStyles.actionBadgeText}>{action.badge}</Text>
                </View>
              ) : null}
            </View>

            <Text style={enhancedStyles.actionTitle}>{action.title}</Text>
            <Text style={enhancedStyles.actionSubtitle}>{action.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentActivity = () => {
    if (recentBookings.length === 0) return null;

    return (
      <View style={enhancedStyles.section}>
        <View style={enhancedStyles.sectionHeader}>
          <Text style={enhancedStyles.sectionTitle}>📋 Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(passenger)/bookings')}>
            <Text style={enhancedStyles.seeAllLink}>View all</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.map((booking) => (
          <TouchableOpacity
            key={booking.id}
            style={enhancedStyles.activityCard}
            onPress={() => handleBookingPress(booking)}
          >
            <View style={enhancedStyles.activityContent}>
              <View style={enhancedStyles.activityIcon}>
                <MaterialIcons
                  name={booking.status === 'completed' ? 'done-all' : 'confirmation-number'}
                  size={20}
                  color={booking.status === 'completed' ? '#28a745' : '#0066cc'}
                />
              </View>

              <View style={enhancedStyles.activityDetails}>
                <Text style={enhancedStyles.activityTitle}>
                  {booking.trip?.route?.startStation?.name || 'Unknown'} → {booking.trip?.route?.endStation?.name || 'Unknown'}
                </Text>
                <Text style={enhancedStyles.activitySubtitle}>
                  {formatDate(booking.trip?.departureTime || booking.createdAt)} • {booking.seats} seat{booking.seats > 1 ? 's' : ''}
                </Text>
              </View>

              <View style={enhancedStyles.activityMeta}>
                <Text style={enhancedStyles.activityAmount}>${booking.amount || '0.00'}</Text>
                <View style={[
                  enhancedStyles.activityStatusDot,
                  { backgroundColor: booking.status === 'completed' ? '#28a745' : '#0066cc' }
                ]} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderPopularStations = () => {
    if (stations.length === 0) return null;

    return (
      <View style={enhancedStyles.section}>
        <View style={enhancedStyles.sectionHeader}>
          <Text style={enhancedStyles.sectionTitle}>🌟 Popular Stations</Text>
          <TouchableOpacity onPress={() => router.push('/(passenger)/search')}>
            <Text style={enhancedStyles.seeAllLink}>View all ({stations.length})</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={enhancedStyles.stationsScrollContainer}
        >
          {stations.slice(0, 6).map((station) => (
            <TouchableOpacity
              key={station.id}
              style={enhancedStyles.stationCard}
              onPress={() => handleStationPress(station)}
            >
              <View style={enhancedStyles.stationIcon}>
                <MaterialIcons name="location-on" size={24} color="#0066cc" />
              </View>

              <Text style={enhancedStyles.stationName} numberOfLines={1}>{station.name}</Text>
              <Text style={enhancedStyles.stationLocation} numberOfLines={1}>
                {station.city}, {station.state}
              </Text>

              {station.amenities && Object.keys(station.amenities).length > 0 && (
                <View style={enhancedStyles.amenitiesIndicator}>
                  <MaterialIcons name="star" size={12} color="#ffc107" />
                  <Text style={enhancedStyles.amenitiesText}>Amenities</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAnalyticsInsight = () => {
    if (!analytics || isNewUser) return null;

    return (
      <View style={enhancedStyles.section}>
        <Text style={enhancedStyles.sectionTitle}>📊 Your Impact</Text>

        <View style={enhancedStyles.insightCard}>
          <View style={enhancedStyles.insightHeader}>
            <MaterialIcons name="eco" size={32} color="#28a745" />
            <View style={enhancedStyles.insightContent}>
              <Text style={enhancedStyles.insightTitle}>Environmental Impact</Text>
              <Text style={enhancedStyles.insightSubtitle}>
                You've saved {analytics.co2Saved.toFixed(1)}kg of CO₂ by choosing shared rides!
              </Text>
            </View>
          </View>

          <View style={enhancedStyles.impactStats}>
            <View style={enhancedStyles.impactStat}>
              <Text style={enhancedStyles.impactNumber}>{analytics.timesSaved.toFixed(0)}</Text>
              <Text style={enhancedStyles.impactLabel}>Hours Saved</Text>
            </View>
            <View style={enhancedStyles.impactStat}>
              <Text style={enhancedStyles.impactNumber}>${analytics.totalSpent.toFixed(0)}</Text>
              <Text style={enhancedStyles.impactLabel}>Total Spent</Text>
            </View>
            <View style={enhancedStyles.impactStat}>
              <Text style={enhancedStyles.impactNumber}>{analytics.favoriteRoute.split(' → ')[0]}</Text>
              <Text style={enhancedStyles.impactLabel}>Favorite Route</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderNewUserWelcome = () => {
    if (!isNewUser) return null;

    return (
      <WelcomeCard
        onBookTrip={() => router.push('/(passenger)/search')}
        userName={firstName}
      />
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={enhancedStyles.container}>
        <View style={enhancedStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={enhancedStyles.loadingText}>Loading your dashboard...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && stations.length === 0) {
    return (
      <View style={enhancedStyles.container}>
        {renderEnhancedHeader()}
        <View style={enhancedStyles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#f44336" />
          <Text style={enhancedStyles.errorText}>{error}</Text>
          <TouchableOpacity style={enhancedStyles.retryButton} onPress={() => fetchEnhancedData()}>
            <Text style={enhancedStyles.retryButtonText}>🔄 Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={enhancedStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEnhancedData(true)}
            colors={['#0066cc']}
            tintColor="#0066cc"
          />
        }
        contentContainerStyle={enhancedStyles.scrollContent}
      >
        {renderEnhancedHeader()}
        {renderNewUserWelcome()}
        {renderNextTrip()}
        {renderQuickActions()}
        {renderRecentActivity()}
        {renderAnalyticsInsight()}
        {renderPopularStations()}

        {/* App Footer */}
        <View style={enhancedStyles.footer}>
          <Text style={enhancedStyles.footerText}>
            Louagi • Sustainable transportation for Tunisia 🇹🇳
          </Text>
          <Text style={enhancedStyles.versionText}>v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Floating Action Button for Quick Book */}
      <TouchableOpacity
        style={enhancedStyles.fab}
        onPress={() => router.push('/(passenger)/search')}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// Enhanced Styles
const enhancedStyles = {
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
  },

  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center' as const,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
  },

  errorText: {
    fontSize: 18,
    color: '#f44336',
    textAlign: 'center' as const,
    marginVertical: 16,
    lineHeight: 24,
  },

  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },

  scrollContent: {
    paddingBottom: 100, // Space for FAB
  },

  // Hero Section
  heroSection: {
    backgroundColor: '#0066cc',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  userSection: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 30,
  },

  userInfo: {
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
    marginBottom: 8,
  },

  newUserBadge: {
    fontSize: 12,
    color: '#ffc107',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start' as const,
    fontWeight: '600' as const,
  },

  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },

  notificationButton: {
    padding: 8,
    position: 'relative' as const,
  },

  notificationBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'white',
  },

  profileButton: {
    padding: 4,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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

  // Enhanced Stats
  statsContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 30,
    gap: 12,
  },

  statCard: {
    flex: 1,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },

  statNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },

  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },

  // Primary Search Button
  primarySearchButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 12,
  },

  searchButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0066cc',
    flex: 1,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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

  // Next Trip Card
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  tripBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
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

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 16,
  },

  quickActionCard: {
    backgroundColor: '#ffffff',
    width: (width - 56) / 2,
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120,
  },

  actionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  actionBadge: {
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  actionBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: 'white',
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },

  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },

  // Recent Activity
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
    alignItems: 'center' as const,
  },

  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },

  activityDetails: {
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

  activityMeta: {
    alignItems: 'flex-end' as const,
  },

  activityAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },

  activityStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Stations Scroll
  stationsScrollContainer: {
    paddingRight: 20,
  },

  stationCard: {
    backgroundColor: '#ffffff',
    width: 140,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  stationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },

  stationName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    textAlign: 'center' as const,
    marginBottom: 4,
  },

  stationLocation: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center' as const,
    marginBottom: 8,
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

  // Analytics Insight
  insightCard: {
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

  insightHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 20,
  },

  insightContent: {
    marginLeft: 16,
    flex: 1,
  },

  insightTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },

  insightSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  impactStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },

  impactStat: {
    alignItems: 'center' as const,
  },

  impactNumber: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#28a745',
    marginBottom: 4,
  },

  impactLabel: {
    fontSize: 12,
    color: '#666',
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
    textAlign: 'center' as const,
  },

  versionText: {
    fontSize: 12,
    color: '#999',
  },

  // Floating Action Button
  fab: {
    position: 'absolute' as const,
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066cc',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};