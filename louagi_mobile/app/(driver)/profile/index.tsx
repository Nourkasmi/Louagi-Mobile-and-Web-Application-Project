// app/(driver)/profile/index.tsx - FIXED Driver Profile Screen
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
  getDriverProfile,
  getDriverEarnings,
  getDriverTrips,
  type User,
  type Driver
} from '../../../src/services/api';

export default function DriverProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // State management
  const [userProfile, setUserProfile] = useState<User | null>(user);
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [tripStats, setTripStats] = useState<any>(null);
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

      // Fetch driver profile
      const driverResponse = await getDriverProfile();
      if (driverResponse.success && driverResponse.data) {
        setDriverProfile(driverResponse.data);
      }

      // Fetch earnings (last 30 days)
      const earningsResponse = await getDriverEarnings({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });
      if (earningsResponse.success && earningsResponse.data) {
        setEarnings(earningsResponse.data.earnings);
      }

      // Fetch trip statistics
      const tripsResponse = await getDriverTrips({ limit: 100 });
      if (tripsResponse.success && tripsResponse.data) {
        const trips = tripsResponse.data.trips;
        const stats = {
          total: trips.length,
          completed: trips.filter(t => t.status === 'completed').length,
          cancelled: trips.filter(t => t.status === 'cancelled').length,
          inProgress: trips.filter(t => t.status === 'in_progress').length,
        };
        setTripStats(stats);
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
          {userProfile?.username?.charAt(0).toUpperCase() || 'D'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{userProfile?.username}</Text>
        <Text style={styles.userEmail}>{userProfile?.email}</Text>
        <Text style={styles.userPhone}>{userProfile?.phone}</Text>
        <Text style={styles.userRole}>🚗 Driver</Text>
        <Text style={styles.userRating}>⭐ {driverProfile?.rating?.toFixed(1) || '5.0'}</Text>
      </View>
    </View>
    
    {/* 🔧 UPDATED: Add Edit Profile Button */}
    <TouchableOpacity
      style={styles.editButton}
      onPress={() => router.push('/(driver)/profile/edit')}
    >
      <Text style={styles.editButtonText}>Edit Profile</Text>
    </TouchableOpacity>
  </View>
);

  // Render driver info card
  const renderDriverInfoCard = () => {
    if (!driverProfile) return null;

    return (
      <View style={styles.driverCard}>
        <Text style={styles.cardTitle}>Driver Information 🚗</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>License Number:</Text>
          <Text style={styles.infoValue}>{driverProfile.licenseNo}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Experience:</Text>
          <Text style={styles.infoValue}>{driverProfile.experience} years</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vehicle Capacity:</Text>
          <Text style={styles.infoValue}>{driverProfile.vehicleCapacity} passengers</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[
            styles.infoValue,
            { color: driverProfile.isVerified ? '#28a745' : '#dc3545' }
          ]}>
            {driverProfile.isVerified ? '✅ Verified' : '❌ Pending Verification'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>License Expiry:</Text>
          <Text style={styles.infoValue}>
            {new Date(driverProfile.licenseExpiry).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  // Render earnings card
  const renderEarningsCard = () => {
    if (!earnings) return null;

    return (
      <View style={styles.earningsCard}>
        <Text style={styles.cardTitle}>Earnings (Last 30 Days) 💰</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>${earnings.totalEarnings?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{earnings.totalTrips || 0}</Text>
            <Text style={styles.statLabel}>Trips Completed</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{earnings.totalPassengers || 0}</Text>
            <Text style={styles.statLabel}>Passengers Served</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>${earnings.averageEarningsPerTrip?.toFixed(2) || '0.00'}</Text>
            <Text style={styles.statLabel}>Avg per Trip</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewMoreButton}
          onPress={() => router.push('/(driver)/earnings')}
        >
          <Text style={styles.viewMoreText}>View Detailed Earnings →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render trip stats
  const renderTripStatsCard = () => {
    if (!tripStats) return null;

    return (
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Trip Statistics 📊</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{tripStats.total}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{tripStats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{tripStats.cancelled}</Text>
            <Text style={styles.statLabel}>Cancelled</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {tripStats.total > 0 ? Math.round((tripStats.completed / tripStats.total) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewMoreButton}
          onPress={() => router.push('/(driver)/trips')}
        >
          <Text style={styles.viewMoreText}>View Trip History →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render quick actions
  const renderQuickActions = () => (
    <View style={styles.actionsCard}>
      <Text style={styles.cardTitle}>Quick Actions ⚡</Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(driver)/dashboard')}
        >
          <Text style={styles.actionIcon}>🏠</Text>
          <Text style={styles.actionText}>Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(driver)/trips')}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionText}>My Trips</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(driver)/earnings')}
        >
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionText}>Earnings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Alert.alert('Support', 'For driver support, please email: drivers@louagi.com');
          }}
        >
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionText}>Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
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
          colors={['#007bff']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Driver Profile</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {renderUserInfoCard()}
      {renderDriverInfoCard()}
      {renderEarningsCard()}
      {renderTripStatsCard()}
      {renderQuickActions()}

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>Louagi Driver v1.0.0</Text>
        <Text style={styles.appInfoText}>Made with ❤️ in Tunisia</Text>
      </View>
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
    backgroundColor: '#007bff',
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
  userRole: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
    marginBottom: 2,
  },
  userRating: {
    fontSize: 14,
    color: '#ffc107',
    fontWeight: '600',
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
    color: '#007bff',
    fontWeight: '600',
  },
  driverCard: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  earningsCard: {
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
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  viewMoreButton: {
    alignSelf: 'flex-end',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#007bff',
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
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
});