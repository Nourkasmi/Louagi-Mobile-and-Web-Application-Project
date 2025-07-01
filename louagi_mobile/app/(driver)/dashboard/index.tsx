// app/(driver)/dashboard/index.tsx - CLEANED + FIXED
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../../src/store/authSlice';
import { RootState } from '../../../src/store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getDriverStatus, 
  getDriverEarnings,
  type DriverStatus,
} from '../../../src/services/api';

export default function DriverDashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  // Check if user is authenticated
  const isAuthenticated = !!user;
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  // State management
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Logout function
  const handleLogout = async () => {
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
  };

  // Fetch driver data
  const fetchDriverData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch driver status
      const statusResponse = await getDriverStatus();
      if (statusResponse.success && statusResponse.data) {
        setDriverStatus(statusResponse.data);
      }

      // Fetch today's earnings
      const earningsResponse = await getDriverEarnings({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      });
      if (earningsResponse.success && earningsResponse.data) {
        setEarnings(earningsResponse.data.earnings);
      }

    } catch (error) {
      console.error('Error fetching driver data:', error);
      // Alert removed for web compatibility
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDriverData();
  }, [fetchDriverData]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading driver dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchDriverData(true)}
        />
      }
    >
      {/* Header with Buttons */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Driver Dashboard</Text>
          <Text style={styles.subtitle}>
            Welcome back, {user?.username}! 👋
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Declare Availability Button */}
      <TouchableOpacity
        style={styles.declareButton}
        onPress={() => router.push('/(driver)/declare-availability')}
      >
        <Text style={styles.declareButtonText}>Declare Availability</Text>
      </TouchableOpacity>

      {/* Earnings Card */}
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(driver)/earnings')}
        >
          <Text style={styles.statNumber}>
            ${earnings?.totalEarnings?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/(driver)/trips')}
        >
          <Text style={styles.statNumber}>{earnings?.totalTrips || 0}</Text>
          <Text style={styles.statLabel}>Trips Today</Text>
        </TouchableOpacity>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {driverStatus?.profile?.rating?.toFixed(1) || '5.0'}⭐
          </Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>
      
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => router.push('/(driver)/trips')}
        >
          <Text style={styles.quickActionText}>📋 Trip History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => router.push('/(driver)/earnings')}
        >
          <Text style={styles.quickActionText}>💰 Earnings</Text>
        </TouchableOpacity>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    gap: 8,
  },
  testButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 70,
  },
  testButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  logoutButtonDisabled: {
    backgroundColor: '#6c757d',
    borderColor: '#6c757d',
  },
  logoutIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusCard: {
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  declareButton: {
    backgroundColor: '#007bff',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  declareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tripCard: {
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
  tripCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tripInfo: {
    marginBottom: 16,
  },
  tripRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  tripTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  tripStatus: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
  },
  capacityInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  capacityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  capacityBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 4,
  },
  capacityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  capacitySubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  autoStartText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '600',
  },
  tripActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
  },
  completeButton: {
    backgroundColor: '#007bff',
  },
  disabledButton: {
    backgroundColor: '#6c757d',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 32,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  selectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  selectionList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  selectionItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedItem: {
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff',
  },
  selectionItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectionItemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});