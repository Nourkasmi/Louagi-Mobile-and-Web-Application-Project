// app/(passenger)/profile/index.tsx - BEAUTIFUL SIMPLE DESIGN
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Animated,
  StatusBar,
  StyleSheet,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { logout } from '../../../src/store/authSlice';
import { RootState } from '../../../src/store/store';
import {
  getCurrentUser,
  getMyBookings,
  type User
} from '../../../src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Simple fade animation hook
const useFadeIn = (delay = 0) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 600,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return opacity;
};

// Animated counter for stats
const AnimatedNumber = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.floor(value * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <Text style={styles.statNumber}>{displayValue}</Text>;
};

// Profile header component
const ProfileHeader = ({ user, onEditPress }: { user: User | null; onEditPress: () => void }) => {
  const fadeAnim = useFadeIn(200);

  const getInitials = (name?: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  return (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0066cc" />

      {/* Background with subtle gradient */}
      <View style={styles.headerBackground}>
        <View style={styles.gradientOverlay} />

        {/* Decorative circles */}
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
      </View>

      {/* Profile content */}
      <View style={styles.headerContent}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(user?.username)}</Text>
            </View>
            <View style={styles.onlineStatus} />
          </View>

          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.username || 'Welcome'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'Loading...'}</Text>

            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={16} color="#4CAF50" />
              <Text style={styles.verifiedText}>Verified Passenger</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <MaterialIcons name="edit" size={20} color="#0066cc" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Stats card component
const StatCard = ({ icon, title, value, delay = 0 }: {
  icon: string;
  title: string;
  value: number | string;
  delay?: number;
}) => {
  const fadeAnim = useFadeIn(delay);

  return (
    <Animated.View style={[styles.statCard, { opacity: fadeAnim }]}>
      <View style={styles.statIconContainer}>
        <MaterialIcons name={icon as any} size={24} color="#0066cc" />
      </View>
      <View style={styles.statContent}>
        {typeof value === 'number' ? (
          <AnimatedNumber value={value} />
        ) : (
          <Text style={styles.statNumber}>{value}</Text>
        )}
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </Animated.View>
  );
};

// Action button component
const ActionButton = ({ icon, title, subtitle, onPress, delay = 0 }: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  delay?: number;
}) => {
  const fadeAnim = useFadeIn(delay);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <View style={styles.actionIconContainer}>
          <MaterialIcons name={icon as any} size={24} color="#0066cc" />
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="#ccc" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Main profile screen
export default function BeautifulProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  // State
  const [userProfile, setUserProfile] = useState<User | null>(user);
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedTrips: 0,
    totalSpent: 0,
    successRate: '0%'
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Get current user
      try {
        const userResponse = await getCurrentUser();
        if (userResponse.success && userResponse.data) {
          setUserProfile(userResponse.data);
        }
      } catch (error) {
        console.log('Using cached user data');
      }

      // Get bookings for stats
      try {
        const bookingsResponse = await getMyBookings({ limit: 50 });

        if (bookingsResponse.success && bookingsResponse.data) {
          const bookings = bookingsResponse.data.bookings || bookingsResponse.data || [];

          if (Array.isArray(bookings)) {
            const completed = bookings.filter(b => b.status === 'completed');
            const cancelled = bookings.filter(b => b.status === 'cancelled');
            const totalSpent = bookings.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
            const attempted = completed.length + cancelled.length;
            const successRate = attempted > 0 ? Math.round((completed.length / attempted) * 100) : 0;

            setStats({
              totalTrips: bookings.length,
              completedTrips: completed.length,
              totalSpent: Math.round(totalSpent),
              successRate: `${successRate}%`
            });
          }
        }
      } catch (error) {
        console.log('No bookings data available');
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            global.authToken = undefined;
            router.replace('/login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            colors={['#0066cc']}
          />
        }
      >
        {/* Profile Header */}
        <ProfileHeader
          user={userProfile}
          onEditPress={() => router.push('/(passenger)/profile/edit' as any)}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Travel Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Travel Statistics</Text>
            <View style={styles.statsContainer}>
              <StatCard
                icon="flight-takeoff"
                title="Total Trips"
                value={stats.totalTrips}
                delay={100}
              />
              <StatCard
                icon="check-circle"
                title="Completed"
                value={stats.completedTrips}
                delay={200}
              />
              <StatCard
                icon="attach-money"
                title="Total Spent"
                value={`$${stats.totalSpent}`}
                delay={300}
              />
              <StatCard
                icon="trending-up"
                title="Success Rate"
                value={stats.successRate}
                delay={400}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsContainer}>
              <ActionButton
                icon="search"
                title="Find Trips"
                subtitle="Search for available rides"
                onPress={() => router.push('/(passenger)/home' as any)}
                delay={500}
              />
              <ActionButton
                icon="history"
                title="My Bookings"
                subtitle="View your trip history"
                onPress={() => router.push('/(passenger)/bookings' as any)}
                delay={600}
              />
              <ActionButton
                icon="payment"
                title="Payment Methods"
                subtitle="Manage your cards"
                onPress={() => Alert.alert('Coming Soon', 'Payment management will be available soon!')}
                delay={700}
              />
              <ActionButton
                icon="support-agent"
                title="Help & Support"
                subtitle="Get help with your account"
                onPress={() => Alert.alert('Support', 'Email: support@louagi.com\nPhone: +216 XX XXX XXX')}
                delay={800}
              />
            </View>
          </View>

          {/* Account Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.accountCard}>
              <View style={styles.accountRow}>
                <MaterialIcons name="person" size={20} color="#666" />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountLabel}>Username</Text>
                  <Text style={styles.accountValue}>{userProfile?.username}</Text>
                </View>
              </View>

              <View style={styles.accountRow}>
                <MaterialIcons name="email" size={20} color="#666" />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountLabel}>Email</Text>
                  <Text style={styles.accountValue}>{userProfile?.email}</Text>
                </View>
              </View>

              <View style={styles.accountRow}>
                <MaterialIcons name="phone" size={20} color="#666" />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountLabel}>Phone</Text>
                  <Text style={styles.accountValue}>{userProfile?.phone || 'Not provided'}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <MaterialIcons name="logout" size={20} color="#dc3545" />
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* App Info */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Louagi v1.0.0</Text>
            <Text style={styles.footerText}>Made with ❤️ in Tunisia</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  scrollView: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  // Header styles
  header: {
    height: 240,
    position: 'relative',
    overflow: 'hidden',
  },

  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0066cc',
  },

  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 102, 204, 0.9)',
  },

  decorativeCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
  },

  circle1: {
    width: 120,
    height: 120,
    top: -60,
    right: -60,
  },

  circle2: {
    width: 80,
    height: 80,
    top: 20,
    left: -40,
  },

  circle3: {
    width: 60,
    height: 60,
    bottom: -30,
    right: 20,
  },

  headerContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },

  onlineStatus: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },

  userDetails: {
    flex: 1,
  },

  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },

  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  verifiedText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 4,
    fontWeight: '500',
  },

  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Content styles
  content: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 32,
  },

  section: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  // Stats styles
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  statContent: {
    alignItems: 'center',
  },

  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Actions styles
  actionsContainer: {
    gap: 12,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },

  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },

  // Account styles
  accountCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  accountInfo: {
    marginLeft: 16,
    flex: 1,
  },

  accountLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },

  accountValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },

  logoutText: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '600',
    marginLeft: 8,
  },

  // Footer styles
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },

  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});