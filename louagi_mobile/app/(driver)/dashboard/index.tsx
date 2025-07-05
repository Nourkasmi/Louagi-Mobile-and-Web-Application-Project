// 📁 app/(driver)/dashboard/index.tsx - FIXED VERSION
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../src/store/authSlice';
import { RootState } from '../../../src/store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getDriverStatus,
  getDriverEarnings,
  getDriverTrips,
  type DriverStatus,
} from '../../../src/services/api';
import { styles } from './index.style';
import { theme } from '../../../src/styles/theme';

export default function DriverDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // State management
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  // 🔧 FIX: Check authentication only after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !user) {
      console.log('🔄 User not authenticated, redirecting to login...');
      router.replace('/login');
    }
  }, [isMounted, user, router]);

  // Initialize animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  // Enhanced logout function
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            console.log('🔄 Logout button pressed');
            try {
              await AsyncStorage.removeItem('louagi_token');
              global.authToken = undefined;
              dispatch(logout());
              router.replace('/login');
              console.log('✅ Logged out and navigated to login');
            } catch (error) {
              console.error('❌ Logout error:', error);
              dispatch(logout());
              router.replace('/login');
            }
          }
        }
      ]
    );
  };

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      // Fetch all data in parallel with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const dataPromise = Promise.all([
        getDriverStatus(),
        getDriverEarnings({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        }),
        getDriverTrips({ limit: 5 })
      ]);

      const [statusResponse, earningsResponse, tripsResponse] = await Promise.race([
        dataPromise,
        timeoutPromise
      ]) as any[];

      if (statusResponse.success && statusResponse.data) {
        setDriverStatus(statusResponse.data);
      }

      if (earningsResponse.success && earningsResponse.data) {
        setEarnings(earningsResponse.data.earnings);
      }

      if (tripsResponse.success && tripsResponse.data) {
        setRecentTrips(tripsResponse.data.trips || []);
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      let errorMessage = 'Failed to load dashboard data';

      if (error.message === 'Request timeout') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        handleLogout();
        return;
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load data on mount (only if authenticated)
  useEffect(() => {
    if (isMounted && user) {
      fetchDashboardData();
    }
  }, [isMounted, user, fetchDashboardData]);

  // Helper functions
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning! 🌅';
    if (hour < 17) return 'Good afternoon! ☀️';
    return 'Good evening! 🌙';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return theme.colors.status.confirmed;
      case 'waiting_passengers': return theme.colors.status.pending;
      case 'on_trip': return theme.colors.status.inProgress;
      case 'in_queue': return theme.colors.status.scheduled;
      default: return theme.colors.status.noShow;
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'When full';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Don't render anything until mounted and authenticated
  if (!isMounted || !user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.secondary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Loading component
  if (loading && !driverStatus) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.secondary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </View>
    );
  }

  // Error component
  if (error && !driverStatus) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboardData()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.secondary} />

      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.driverName}>{user?.username || 'Driver'}! 👋</Text>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Status Indicator */}
        {driverStatus && (
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(driverStatus.availabilityStatus) }
              ]}
            />
            <Text style={styles.statusText}>
              {driverStatus.statusMessage}
            </Text>
            <Text style={styles.currentTime}>
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchDashboardData(true)}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Declare Availability Button */}
        <View style={styles.declareSection}>
          <TouchableOpacity
            style={styles.declareButton}
            onPress={() => router.push('/(driver)/declare-availability')}
          >
            <Text style={styles.declareButtonIcon}>📍</Text>
            <Text style={styles.declareButtonText}>Declare Availability</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Stats */}
        {earnings && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Today's Performance</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {formatCurrency(earnings.totalEarnings || 0)}
                </Text>
                <Text style={styles.statLabel}>Today's Earnings</Text>
                <Text style={styles.statTrend}>+12% from yesterday</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{earnings.totalTrips || 0}</Text>
                <Text style={styles.statLabel}>Trips Today</Text>
                <Text style={styles.statTrend}>
                  {earnings.totalTrips > 0 ? 'Great job!' : 'Get started!'}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {driverStatus?.profile?.rating?.toFixed(1) || '5.0'}⭐
                </Text>
                <Text style={styles.statLabel}>Rating</Text>
                <Text style={styles.statTrend}>Excellent!</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(driver)/trips')}
            >
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={styles.quickActionText}>Trip History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(driver)/earnings')}
            >
              <Text style={styles.quickActionIcon}>💰</Text>
              <Text style={styles.quickActionText}>Earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => router.push('/(driver)/profile')}
            >
              <Text style={styles.quickActionIcon}>👤</Text>
              <Text style={styles.quickActionText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Trip Section */}
        {driverStatus?.activeTrip && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Trip 🚗</Text>
            <View style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripTitle}>Current Trip</Text>
                <View style={[
                  styles.tripStatus,
                  { backgroundColor: getStatusColor(driverStatus.activeTrip.status) }
                ]}>
                  <Text style={styles.tripStatusText}>
                    {driverStatus.activeTrip.status}
                  </Text>
                </View>
              </View>

              <View style={styles.tripContent}>
                <Text style={styles.routeText}>
                  📍 {driverStatus.activeTrip.route.startStation.name}
                </Text>
                <Text style={styles.routeArrow}>↓</Text>
                <Text style={styles.routeText}>
                  📍 {driverStatus.activeTrip.route.endStation.name}
                </Text>

                <View style={styles.tripDetails}>
                  <View style={styles.tripDetailItem}>
                    <Text style={styles.tripDetailLabel}>Departure</Text>
                    <Text style={styles.tripDetailValue}>
                      {formatTime(driverStatus.activeTrip.departureTime)}
                    </Text>
                  </View>

                  <View style={styles.tripDetailItem}>
                    <Text style={styles.tripDetailLabel}>Passengers</Text>
                    <Text style={styles.tripDetailValue}>
                      {driverStatus.activeTrip.capacity - driverStatus.activeTrip.availableSeats}/
                      {driverStatus.activeTrip.capacity}
                    </Text>
                  </View>
                </View>

                {/* Trip Actions */}
                <View style={styles.tripActions}>
                  {driverStatus.activeTrip.status === 'scheduled' && (
                    <>
                      <TouchableOpacity style={[styles.actionButton, styles.startButton]}>
                        <Text style={styles.actionButtonText}>▶️ Start Trip</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
                        <Text style={styles.actionButtonText}>❌ Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {driverStatus.activeTrip.status === 'in_progress' && (
                    <TouchableOpacity style={[styles.actionButton, styles.completeButton]}>
                      <Text style={styles.actionButtonText}>✅ Complete Trip</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Recent Trips History */}
        {recentTrips && recentTrips.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Trips</Text>
              <TouchableOpacity onPress={() => router.push('/(driver)/trips')}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            </View>

            {recentTrips.slice(0, 3).map((trip, index) => (
              <View key={trip.id || index} style={styles.recentTripCard}>
                <View style={styles.recentTripHeader}>
                  <View style={styles.recentTripRoute}>
                    <Text style={styles.recentTripText}>
                      {trip.route?.startStation?.name || 'Unknown'} → {trip.route?.endStation?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.recentTripDate}>
                      {new Date(trip.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.recentTripDetails}>
                    <Text style={styles.recentTripEarnings}>
                      {formatCurrency(trip.currentPrice * 0.8 || 0)}
                    </Text>
                    <View style={[
                      styles.recentTripStatus,
                      { backgroundColor: getStatusColor(trip.status) }
                    ]}>
                      <Text style={styles.recentTripStatusText}>
                        {trip.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Weekly Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week Summary</Text>
          <View style={styles.weeklyCard}>
            <View style={styles.weeklyStats}>
              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatNumber}>
                  {formatCurrency((earnings?.totalEarnings || 0) * 6.2)}
                </Text>
                <Text style={styles.weeklyStatLabel}>Weekly Earnings</Text>
              </View>

              <View style={styles.weeklyStat}>
                <Text style={styles.weeklyStatNumber}>
                  {(earnings?.totalTrips || 0) * 5}
                </Text>
                <Text style={styles.weeklyStatLabel}>Total Trips</Text>
              </View>
            </View>

            <View style={styles.weeklyProgress}>
              <Text style={styles.weeklyProgressLabel}>Weekly Goal Progress</Text>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(((earnings?.totalEarnings || 0) * 6.2) / 500 * 100, 100)}%`,
                    backgroundColor: theme.colors.success
                  }
                ]} />
              </View>
              <Text style={styles.weeklyProgressText}>
                {Math.round(((earnings?.totalEarnings || 0) * 6.2) / 500 * 100)}% of 500 TND goal
              </Text>
            </View>
          </View>
        </View>

        {/* Driver Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Driver Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>⏰</Text>
              <Text style={styles.tipText}>
                Peak hours are 7-9 AM and 5-7 PM for maximum earnings
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>⭐</Text>
              <Text style={styles.tipText}>
                Maintain a 4.5+ rating to receive priority bookings
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🚗</Text>
              <Text style={styles.tipText}>
                Keep your vehicle clean and comfortable for better reviews
              </Text>
            </View>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <View style={styles.supportCard}>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => {
                Alert.alert(
                  'Driver Support',
                  'For assistance, please contact:\n📧 drivers@louagi.com\n📞 +216 XX XXX XXX'
                );
              }}
            >
              <Text style={styles.supportIcon}>💬</Text>
              <Text style={styles.supportText}>Contact Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => {
                Alert.alert('FAQ', 'FAQ section coming soon!');
              }}
            >
              <Text style={styles.supportIcon}>❓</Text>
              <Text style={styles.supportText}>FAQ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </Animated.View>
  );
}