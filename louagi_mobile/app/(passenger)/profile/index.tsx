// app/(tabs)/passenger-profile/index.tsx - Passenger Profile Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../src/store/authSlice';
import { RootState } from '../../../src/store/store';
import { 
  getCurrentUser,
  getPassengerAnalytics,
  getMyBookings,
  getMyPayments,
  type User 
} from '../../../src/services/api';

export default function PassengerProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // State management
  const [userProfile, setUserProfile] = useState<User | null>(user);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch profile data
  const fetchProfileData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch current user profile
      const userResponse = await getCurrentUser();
      if (userResponse.success && userResponse.data) {
        setUserProfile(userResponse.data);
      }

      // Fetch passenger analytics (last 6 months)
      const analyticsResponse = await getPassengerAnalytics(6);
      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data.analytics);
      }

      // Fetch recent bookings (last 5)
      const bookingsResponse = await getMyBookings({ limit: 5 });
      if (bookingsResponse.success && bookingsResponse.data) {
        setRecentBookings(bookingsResponse.data.bookings || []);
      }

      // Fetch payment summary
      const paymentsResponse = await getMyPayments({ limit: 10 });
      if (paymentsResponse.success && paymentsResponse.data) {
        const payments = paymentsResponse.data.payments || [];
        const totalSpent = payments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0);
        
        setPaymentSummary({
          totalSpent,
          paymentsCount: payments.length,
          lastPayment: payments[0] || null
        });
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
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

  // Render user info card
  const renderUserInfoCard = () => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userProfile?.username?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userProfile?.username}</Text>
          <Text style={styles.userEmail}>{userProfile?.email}</Text>
          <Text style={styles.userPhone}>{userProfile?.phone}</Text>
          <Text style={styles.userRole}>🎫 Passenger</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => {
          Alert.alert('Coming Soon', 'Profile editing will be available soon!');
        }}
      >
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  // Render travel stats card
  const renderTravelStatsCard = () => {
    if (!analytics) return null;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Travel Statistics 📊</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{analytics.summary.totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{analytics.summary.completedTrips}</Text>
            <Text style={styles.statLabel}>Completed Trips</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>${analytics.summary.totalSpent.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Spent</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{analytics.summary.completionRate}</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        <View style={styles.averageSection}>
          <Text style={styles.averageText}>
            💰 Average per trip: ${analytics.summary.averageSpentPerTrip.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.viewMoreButton}
          onPress={() => router.push('/(tabs)/passenger-bookings')}
        >
          <Text style={styles.viewMoreText}>View All Bookings →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render recent bookings
  const renderRecentBookingsCard = () => (
    <View style={styles.recentCard}>
      <Text style={styles.cardTitle}>Recent Activity 🎫</Text>
      
      {recentBookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🚐</Text>
          <Text style={styles.emptyText}>No recent bookings</Text>
          <Text style={styles.emptySubtext}>Start your journey today!</Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/passenger')}
          >
            <Text style={styles.exploreButtonText}>Explore Trips</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {recentBookings.slice(0, 3).map((booking) => (
            <View key={booking.id} style={styles.bookingItem}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingRoute}>
                  {booking.trip.route.startStation.name} → {booking.trip.route.endStation.name}
                </Text>
                <Text style={styles.bookingDate}>
                  {new Date(booking.createdAt).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
                <Text style={styles.bookingReference}>#{booking.bookingReference}</Text>
              </View>
              
              <View style={styles.bookingStatus}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(booking.status) }
                ]}>
                  {getStatusIcon(booking.status)} {booking.status}
                </Text>
                <Text style={styles.bookingAmount}>
                  ${booking.amount}
                </Text>
              </View>
            </View>
          ))}
          
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/(tabs)/passenger-bookings')}
          >
            <Text style={styles.viewAllText}>View All Bookings →</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  // Render payment summary
  const renderPaymentSummaryCard = () => {
    if (!paymentSummary) return null;

    return (
      <View style={styles.paymentCard}>
        <Text style={styles.cardTitle}>Payment Summary 💳</Text>
        
        <View style={styles.paymentStats}>
          <View style={styles.paymentStat}>
            <Text style={styles.paymentNumber}>${paymentSummary.totalSpent.toFixed(2)}</Text>
            <Text style={styles.paymentLabel}>Total Spent</Text>
          </View>
          
          <View style={styles.paymentStat}>
            <Text style={styles.paymentNumber}>{paymentSummary.paymentsCount}</Text>
            <Text style={styles.paymentLabel}>Transactions</Text>
          </View>
        </View>

        {paymentSummary.lastPayment && (
          <View style={styles.lastPaymentInfo}>
            <Text style={styles.lastPaymentText}>
              Last payment: ${paymentSummary.lastPayment.amount} on{' '}
              {new Date(paymentSummary.lastPayment.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.managePaymentButton}
          onPress={() => {
            Alert.alert('Coming Soon', 'Payment method management coming soon!');
          }}
        >
          <Text style={styles.managePaymentText}>Manage Payment Methods</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render quick actions
  const renderQuickActionsCard = () => (
    <View style={styles.actionsCard}>
      <Text style={styles.cardTitle}>Quick Actions ⚡</Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/passenger')}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionText}>Search Trips</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/passenger-bookings')}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>My Bookings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Alert.alert('Support', 'Email: support@louagi.com\nPhone: +216 XX XXX XXX');
          }}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Alert.alert('Settings', 'Notification settings coming soon!');
          }}
        >
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render app info
  const renderAppInfo = () => (
    <View style={styles.appInfo}>
      <Text style={styles.appInfoText}>Louagi Mobile v1.0.0</Text>
      <Text style={styles.appInfoText}>Made with ❤️ in Tunisia 🇹🇳</Text>
      <Text style={styles.appInfoText}>Your trusted travel companion</Text>
    </View>
  );

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffc107';
      case 'confirmed': return '#28a745';
      case 'completed': return '#007bff';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'confirmed': return '✅';
      case 'completed': return '🎉';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchProfileData(true)}
          colors={['#0066cc']}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {renderUserInfoCard()}
      {renderTravelStatsCard()}
      {renderRecentBookingsCard()}
      {renderPaymentSummaryCard()}
      {renderQuickActionsCard()}
      {renderAppInfo()}
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '600',
  },
  userCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  averageSection: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  averageText: {
    fontSize: 14,
    color: '#0066cc',
    textAlign: 'center',
    fontWeight: '500',
  },
  viewMoreButton: {
    alignSelf: 'flex-end',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
  },
  recentCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  exploreButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bookingInfo: {
    flex: 1,
  },
  bookingRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  bookingReference: {
    fontSize: 11,
    color: '#0066cc',
    fontWeight: '500',
  },
  bookingStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  viewAllButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  paymentStat: {
    alignItems: 'center',
  },
  paymentNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#666',
  },
  lastPaymentInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  lastPaymentText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  managePaymentButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  managePaymentText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 40,
  },
  appInfoText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    textAlign: 'center',
  },
});