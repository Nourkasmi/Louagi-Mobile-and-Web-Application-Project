// app/(tabs)/driver/index.tsx - Driver Dashboard Screen
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
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  getDriverStatus, 
  declareAvailability, 
  getTripCapacityStatus,
  cancelWaitingTrip,
  updateTripStatus,
  completeTrip,
  getStations,
  getDestinations,
  getDriverEarnings,
  type DriverStatus,
  type TripCapacityStatus,
  type Trip,
  type Station,
  type Destination
} from '../../../src/services/api';

export default function DriverDashboard() {
  const router = useRouter();
  
  // State management
  const [driverStatus, setDriverStatus] = useState<DriverStatus | null>(null);
  const [capacityStatus, setCapacityStatus] = useState<TripCapacityStatus | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states for availability declaration
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

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
        setActiveTrip(statusResponse.data.activeTrip);

        // If driver has active trip waiting for passengers, get capacity status
        if (statusResponse.data.activeTrip?.status === 'scheduled') {
          const capacityResponse = await getTripCapacityStatus();
          if (capacityResponse.success && capacityResponse.data) {
            setCapacityStatus(capacityResponse.data);
          }
        } else {
          setCapacityStatus(null);
        }
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
      Alert.alert('Error', 'Failed to load driver information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load and periodic refresh
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

  // Load stations for availability declaration
  const loadStations = async () => {
    try {
      setLoadingStations(true);
      const response = await getStations({ limit: 50 });
      if (response.success && response.data) {
        setStations(response.data.stations);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load stations');
    } finally {
      setLoadingStations(false);
    }
  };

  // Load destinations for selected station
  const loadDestinations = async (stationId: string) => {
    try {
      setLoadingDestinations(true);
      const response = await getDestinations(stationId, { limit: 50 });
      if (response.success && response.data) {
        setDestinations(response.data.destinations);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load destinations');
    } finally {
      setLoadingDestinations(false);
    }
  };

  // Handle station selection
  const handleStationSelection = (station: Station) => {
    setSelectedStation(station);
    setSelectedDestination(null);
    setDestinations([]);
    loadDestinations(station.id);
  };

  // Declare availability action
  const handleDeclareAvailability = async () => {
    if (!selectedStation || !selectedDestination) {
      Alert.alert('Error', 'Please select both station and destination');
      return;
    }

    try {
      setActionLoading(true);
      
      // For now, we'll use a mock schedule ID - in production, you'd let user select
      const mockScheduleId = 'schedule-1'; 
      
      const response = await declareAvailability({
        stationId: selectedStation.id,
        scheduleId: mockScheduleId,
        destinationId: selectedDestination.id
      });

      if (response.success && response.data) {
        setShowAvailabilityModal(false);
        Alert.alert(
          'Success!', 
          response.data.wasAutoStarted 
            ? `Trip auto-started with ${response.data.autoConfirmedBookings} passengers!`
            : `Trip created! Waiting for passengers (${response.data.availableSeats}/${response.data.totalCapacity} seats available)`,
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
      `Are you sure you want to start this trip? ${capacityStatus ? `Current passengers: ${capacityStatus.bookedSeats}/${capacityStatus.totalCapacity}` : ''}`,
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
              const response = await completeTrip(activeTrip.id);
              
              if (response.success) {
                Alert.alert('Success', 'Trip completed successfully! 🎉');
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
    if (!activeTrip || !capacityStatus) return;

    if (capacityStatus.bookedSeats > 0) {
      Alert.alert('Cannot Cancel', 'You cannot cancel a trip that already has passengers booked.');
      return;
    }

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

  // Render status card
  const renderStatusCard = () => {
    if (!driverStatus) return null;

    const { availabilityStatus, statusMessage, canDeclareAvailability } = driverStatus;
    
    let statusColor = '#28a745'; // green
    let statusIcon = '✅';
    
    if (availabilityStatus === 'waiting_passengers') {
      statusColor = '#ffc107'; // yellow
      statusIcon = '⏳';
    } else if (availabilityStatus === 'on_trip') {
      statusColor = '#007bff'; // blue
      statusIcon = '🚗';
    } else if (availabilityStatus === 'in_queue') {
      statusColor = '#6c757d'; // gray
      statusIcon = '🔄';
    }

    return (
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
          <Text style={styles.statusTitle}>Driver Status {statusIcon}</Text>
        </View>
        <Text style={styles.statusMessage}>{statusMessage}</Text>
        
        {canDeclareAvailability && (
          <TouchableOpacity
            style={styles.declareButton}
            onPress={() => {
              setShowAvailabilityModal(true);
              loadStations();
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
        <Text style={styles.tripCardTitle}>
          Active Trip {activeTrip.status === 'scheduled' ? '⏳' : activeTrip.status === 'in_progress' ? '🚗' : '✅'}
        </Text>
        
        <View style={styles.tripInfo}>
          <Text style={styles.tripRoute}>{activeTrip.route.description}</Text>
          <Text style={styles.tripTime}>
            Departure: {activeTrip.departureTime ? new Date(activeTrip.departureTime).toLocaleTimeString() : 'When full'}
          </Text>
          <Text style={styles.tripStatus}>Status: {activeTrip.status}</Text>
        </View>

        {capacityStatus && (
          <View style={styles.capacityInfo}>
            <Text style={styles.capacityTitle}>
              Passenger Status {capacityStatus.percentageFull === 100 ? '🚀' : '👥'}
            </Text>
            <View style={styles.capacityBar}>
              <View 
                style={[
                  styles.capacityFill, 
                  { 
                    width: `${capacityStatus.percentageFull}%`,
                    backgroundColor: capacityStatus.percentageFull === 100 ? '#28a745' : '#ffc107'
                  }
                ]} 
              />
            </View>
            <Text style={styles.capacityText}>
              {capacityStatus.bookedSeats}/{capacityStatus.totalCapacity} seats filled ({capacityStatus.percentageFull}%)
            </Text>
            <Text style={styles.capacitySubtext}>
              {capacityStatus.bookingsCount} bookings • {capacityStatus.availableSeats} seats available
            </Text>
            {capacityStatus.willStartWhenFull && (
              <Text style={styles.autoStartText}>
                🚀 Will auto-start when full
              </Text>
            )}
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
                style={[
                  styles.actionButton, 
                  styles.cancelButton,
                  (capacityStatus?.bookedSeats || 0) > 0 && styles.disabledButton
                ]}
                onPress={handleCancelWaitingTrip}
                disabled={actionLoading || (capacityStatus?.bookedSeats || 0) > 0}
              >
                <Text style={styles.actionButtonText}>
                  {(capacityStatus?.bookedSeats || 0) > 0 ? 'Has Passengers' : 'Cancel'}
                </Text>
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

  // Render earnings card
  const renderEarningsCard = () => (
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
  );

  // Render availability modal
  const renderAvailabilityModal = () => (
    <Modal
      visible={showAvailabilityModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Declare Availability</Text>
          <TouchableOpacity
            onPress={() => setShowAvailabilityModal(false)}
            style={styles.modalCloseButton}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Station Selection */}
          <Text style={styles.selectionLabel}>Select Station:</Text>
          {loadingStations ? (
            <ActivityIndicator size="small" color="#007bff" />
          ) : (
            <FlatList
              data={stations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.selectionItem,
                    selectedStation?.id === item.id && styles.selectedItem
                  ]}
                  onPress={() => handleStationSelection(item)}
                >
                  <Text style={styles.selectionItemTitle}>{item.name}</Text>
                  <Text style={styles.selectionItemSubtitle}>
                    {item.city}, {item.state}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.selectionList}
            />
          )}

          {/* Destination Selection */}
          {selectedStation && (
            <>
              <Text style={styles.selectionLabel}>Select Destination:</Text>
              {loadingDestinations ? (
                <ActivityIndicator size="small" color="#007bff" />
              ) : (
                <FlatList
                  data={destinations}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.selectionItem,
                        selectedDestination?.id === item.id && styles.selectedItem
                      ]}
                      onPress={() => setSelectedDestination(item)}
                    >
                      <Text style={styles.selectionItemTitle}>
                        {item.endStation.name}
                      </Text>
                      <Text style={styles.selectionItemSubtitle}>
                        ${item.basePrice} • {item.estimatedDuration} min
                      </Text>
                    </TouchableOpacity>
                  )}
                  style={styles.selectionList}
                />
              )}
            </>
          )}

          {/* Confirm Button */}
          {selectedStation && selectedDestination && (
            <TouchableOpacity
              style={[styles.confirmButton, actionLoading && styles.disabledButton]}
              onPress={handleDeclareAvailability}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Create Trip: {selectedStation.name} → {selectedDestination.endStation.name}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
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
        <Text style={styles.subtitle}>
          Welcome back, {driverStatus?.profile?.user?.username}! 👋
        </Text>
      </View>

      {renderStatusCard()}
      {renderActiveTripCard()}
      {renderEarningsCard()}
      
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

      {renderAvailabilityModal()}
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
    fontSize: 14,
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