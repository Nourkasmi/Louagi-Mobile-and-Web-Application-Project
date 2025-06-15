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
import { 
  getDriverStatus, 
  declareAvailability, 
  getTripCapacityStatus,
  cancelWaitingTrip,
  getDriverTrips,
  updateTripStatus,
  type DriverStatus,
  type TripCapacityStatus,
  type Trip
} from '../../../src/services/api';

export default function DriverHome() {
  const router = useRouter();
  
  // State management
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [capacityStatus, setCapacityStatus] = useState<TripCapacityStatus | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [availableStations, setAvailableStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch driver status and data
  const fetchDriverData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch driver status
      const statusResponse = await getDriverStatus();
      if (statusResponse.success) {
        setDriverStatus(statusResponse.driver);
        setActiveTrip(statusResponse.driver.activeTrip);

        // If driver has active trip waiting for passengers, get capacity status
        if (statusResponse.driver.activeTrip?.status === 'scheduled') {
          const capacityResponse = await getTripCapacityStatus();
          if (capacityResponse.success) {
            setCapacityStatus(capacityResponse.trip);
          }
        }
      }

      // Fetch available stations for availability declaration
      // This would come from your stations API
      // setAvailableStations(stationsData);

    } catch (error) {
      console.error('Error fetching driver data:', error);
      Alert.alert('Error', 'Failed to load driver information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDriverData();
    
    // Set up interval to refresh capacity status if waiting for passengers
    const interval = setInterval(() => {
      if (activeTrip?.status === 'scheduled') {
        fetchDriverData(true);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [fetchDriverData, activeTrip]);

  // Declare availability action
  const handleDeclareAvailability = async (stationId: string, scheduleId: string, destinationId: string) => {
    try {
      setActionLoading(true);
      
      const response = await declareAvailability({
        stationId,
        scheduleId,
        destinationId
      });

      if (response.success) {
        Alert.alert(
          'Success!', 
          response.message || 'Trip created! Waiting for passengers.',
          [{ text: 'OK', onPress: () => fetchDriverData() }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to declare availability');
      }
    } catch (error) {
      console.error('Error declaring availability:', error);
      Alert.alert('Error', 'Failed to declare availability');
    } finally {
      setActionLoading(false);
    }
  };

  // Start trip manually
  const handleStartTrip = async () => {
    if (!activeTrip) return;

    Alert.alert(
      'Start Trip',
      'Are you sure you want to start this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Trip',
          onPress: async () => {
            try {
              setActionLoading(true);
              
              const response = await updateTripStatus(activeTrip.id, 'in_progress');
              
              if (response.success) {
                Alert.alert('Success', 'Trip started successfully!');
                fetchDriverData();
              } else {
                Alert.alert('Error', response.message || 'Failed to start trip');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to start trip');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  // Complete trip
  const handleCompleteTrip = async () => {
    if (!activeTrip) return;

    Alert.alert(
      'Complete Trip',
      'Mark this trip as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              setActionLoading(true);
              
              const response = await updateTripStatus(activeTrip.id, 'completed');
              
              if (response.success) {
                Alert.alert('Success', 'Trip completed successfully!');
                fetchDriverData();
              } else {
                Alert.alert('Error', response.message || 'Failed to complete trip');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to complete trip');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  // Cancel waiting trip
  const handleCancelWaitingTrip = async () => {
    if (!activeTrip) return;

    Alert.alert(
      'Cancel Trip',
      'Are you sure you want to cancel this waiting trip?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              
              const response = await cancelWaitingTrip();
              
              if (response.success) {
                Alert.alert('Success', 'Trip cancelled successfully');
                fetchDriverData();
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel trip');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel trip');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  // Render availability status
  const renderStatusCard = () => {
    if (!driverStatus) return null;

    const { availabilityStatus, statusMessage, canDeclareAvailability } = driverStatus;
    
    let statusColor = '#28a745'; // green
    if (availabilityStatus === 'waiting_passengers') statusColor = '#ffc107'; // yellow
    if (availabilityStatus === 'on_trip') statusColor = '#007bff'; // blue
    if (availabilityStatus === 'in_queue') statusColor = '#6c757d'; // gray

    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          <Text style={styles.statusTitle}>Driver Status</Text>
        </View>
        <Text style={styles.statusMessage}>{statusMessage}</Text>
        
        {canDeclareAvailability && (
          <TouchableOpacity
            style={styles.declareButton}
            onPress={() => {
              // For demo, show simple station selection
              // In production, you'd show a proper station/destination picker
              Alert.alert(
                'Declare Availability',
                'Choose your station and destination',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Station A → Destination B', 
                    onPress: () => handleDeclareAvailability('station1', 'schedule1', 'dest1')
                  }
                ]
              );
            }}
            disabled={actionLoading}
          >
            <Text style={styles.declareButtonText}>
              {actionLoading ? 'Processing...' : 'Declare Availability'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render active trip card
  const renderActiveTripCard = () => {
    if (!activeTrip) return null;

    return (
      <View style={styles.tripCard}>
        <Text style={styles.tripCardTitle}>Active Trip</Text>
        
        <View style={styles.tripInfo}>
          <Text style={styles.tripRoute}>{activeTrip.route.description}</Text>
          <Text style={styles.tripTime}>
            Departure: {new Date(activeTrip.departureTime).toLocaleTimeString()}
          </Text>
          <Text style={styles.tripStatus}>Status: {activeTrip.status}</Text>
        </View>

        {capacityStatus && (
          <View style={styles.capacityInfo}>
            <Text style={styles.capacityTitle}>Passenger Status</Text>
            <View style={styles.capacityBar}>
              <View 
                style={[
                  styles.capacityFill, 
                  { width: `${capacityStatus.percentageFull}%` }
                ]} 
              />
            </View>
            <Text style={styles.capacityText}>
              {capacityStatus.bookedSeats}/{capacityStatus.totalCapacity} seats filled
            </Text>
            <Text style={styles.capacitySubtext}>
              {capacityStatus.bookingsCount} bookings
            </Text>
          </View>
        )}

        <View style={styles.tripActions}>
          {activeTrip.status === 'scheduled' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={handleStartTrip}
                disabled={actionLoading}
              >
                <Text style={styles.actionButtonText}>Start Trip</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelWaitingTrip}
                disabled={actionLoading || (capacityStatus?.bookedSeats || 0) > 0}
              >
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          
          {activeTrip.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleCompleteTrip}
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>Complete Trip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render quick stats
  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <TouchableOpacity 
        style={styles.statCard}
        onPress={() => router.push('/(tabs)/driver/TripHistoryScreen')}
      >
        <Text style={styles.statNumber}>12</Text>
        <Text style={styles.statLabel}>Trips Today</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.statCard}
        onPress={() => router.push('/(tabs)/driver/EarningsScreen')}
      >
        <Text style={styles.statNumber}>$245</Text>
        <Text style={styles.statLabel}>Today's Earnings</Text>
      </TouchableOpacity>
      
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>4.8⭐</Text>
        <Text style={styles.statLabel}>Rating</Text>
      </View>
    </View>
  );

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
      <View style={styles.header}>
        <Text style={styles.title}>Driver Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back!</Text>
      </View>

      {renderStatusCard()}
      {renderActiveTripCard()}
      {renderQuickStats()}
      
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => router.push('/(tabs)/driver/TripHistoryScreen')}
        >
          <Text style={styles.quickActionText}>Trip History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={() => router.push('/(tabs)/driver/EarningsScreen')}
        >
          <Text style={styles.quickActionText}>Earnings</Text>
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
    backgroundColor: '#28a745',
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
});
