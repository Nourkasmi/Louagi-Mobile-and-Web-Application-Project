// app/(driver)/trips/index.tsx - FIXED Driver Trips Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getDriverTrips,
  updateTripStatus,
  completeTrip,
  type Trip,
} from '../../../src/services/api';

type FilterType = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export default function DriverTripsScreen() {
  const router = useRouter();

  // State management
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch trips
  const fetchTrips = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🔍 Fetching trips with filter:', activeFilter);

      const response = await getDriverTrips({
        status: activeFilter === 'all' ? undefined : activeFilter,
        limit: 50,
      });

      console.log('📊 API Response:', {
        success: response.success,
        hasData: !!response.data,
        tripsCount: response.data?.trips?.length || 0,
        firstTrip: response.data?.trips?.[0] || null
      });

      if (response.success) {
        // ✅ FIXED: Handle different response structures
        let tripsData: Trip[] = [];
        
        if (response.data?.trips) {
          tripsData = response.data.trips;
        } else if (response.trips) {
          tripsData = response.trips;
        } else if (Array.isArray(response.data)) {
          tripsData = response.data;
        } else if (Array.isArray(response)) {
          tripsData = response;
        }

        console.log('✅ Setting trips data:', tripsData.length, 'trips');
        setTrips(tripsData);

        if (tripsData.length === 0) {
          console.log('ℹ️ No trips found for filter:', activeFilter);
        }
      } else {
        console.error('❌ API returned error:', response.message);
        setTrips([]);
        Alert.alert('Error', response.message || 'Failed to load trips');
      }
    } catch (error) {
      console.error('💥 Error fetching trips:', error);
      setTrips([]);
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  // Initial load and when filter changes
  useEffect(() => {
    console.log('🔄 Effect triggered - fetching trips');
    fetchTrips();
  }, [activeFilter, fetchTrips]);

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    console.log('🔽 Filter changed to:', filter);
    setActiveFilter(filter);
  };

  // Handle trip status update
  const handleStatusUpdate = async (trip: Trip, newStatus: Trip['status']) => {
    Alert.alert(
      'Update Trip Status',
      `Change trip status to ${newStatus}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setActionLoading(trip.id);

              let response;
              if (newStatus === 'completed') {
                response = await completeTrip(trip.id);
              } else {
                response = await updateTripStatus(trip.id, newStatus);
              }

              if (response.success) {
                Alert.alert('Success', `Trip ${newStatus} successfully`);
                fetchTrips(true);
              } else {
                Alert.alert('Error', response.message || 'Failed to update trip');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update trip status');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  // Format date and time
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return { date: 'Not set', time: '' };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  // Get status color
  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'scheduled': return '#ffc107';
      case 'in_progress': return '#007bff';
      case 'completed': return '#28a745';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Get status icon
  const getStatusIcon = (status: Trip['status']) => {
    switch (status) {
      case 'scheduled': return '⏳';
      case 'in_progress': return '🚗';
      case 'completed': return '✅';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  };

  // Calculate earnings for trip
  const calculateTripEarnings = (trip: Trip) => {
    const bookedSeats = trip.capacity - trip.availableSeats;
    const totalRevenue = (trip.currentPrice / trip.capacity) * bookedSeats;
    const driverEarnings = totalRevenue * 0.8; // 80% to driver
    return driverEarnings;
  };

  // ✅ FIXED: Better defensive rendering for trip item
  const renderTripItem = ({ item }: { item: Trip }) => {
    // ✅ FIXED: Comprehensive validation
    if (!item) {
      console.warn('⚠️ Null trip item received');
      return null;
    }

    // ✅ FIXED: Handle missing route data
    if (!item.route) {
      console.warn('⚠️ Trip missing route data:', item);
      return (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ Trip data incomplete</Text>
          <Text style={styles.errorSubtext}>Trip ID: {item.id}</Text>
          <Text style={styles.errorSubtext}>Status: {item.status}</Text>
        </View>
      );
    }

    // ✅ FIXED: Handle missing station data
    const routeDescription = item.route.description || 'Route information unavailable';
    const startStationName = item.route.startStation?.name || 'Unknown departure';
    const endStationName = item.route.endStation?.name || 'Unknown destination';

    const { date, time } = formatDateTime(item.departureTime);
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const bookedSeats = item.capacity - item.availableSeats;
    const earnings = calculateTripEarnings(item);
    const isActionLoading = actionLoading === item.id;

    return (
      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <View style={styles.routeSection}>
            <Text style={styles.routeText}>{routeDescription}</Text>
            <Text style={styles.routeDetails}>
              {startStationName} → {endStationName}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusIcon} {item.status}</Text>
          </View>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>Departure</Text>
            <Text style={styles.timeValue}>{time || 'When full'}</Text>
            <Text style={styles.dateValue}>{date}</Text>
          </View>

          <View style={styles.capacitySection}>
            <Text style={styles.capacityLabel}>Passengers</Text>
            <Text style={styles.capacityValue}>
              {bookedSeats}/{item.capacity}
            </Text>
            <Text style={styles.capacityPercent}>
              {Math.round((bookedSeats / item.capacity) * 100)}%
            </Text>
          </View>

          <View style={styles.earningsSection}>
            <Text style={styles.earningsLabel}>Earnings</Text>
            <Text style={styles.earningsValue}>
              ${earnings.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Action buttons for active trips */}
        {(item.status === 'scheduled' || item.status === 'in_progress') && (
          <View style={styles.actionButtons}>
            {item.status === 'scheduled' && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.startButton]}
                  onPress={() => handleStatusUpdate(item, 'in_progress')}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.actionButtonText}>Start Trip</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={() => handleStatusUpdate(item, 'cancelled')}
                  disabled={isActionLoading || bookedSeats > 0}
                >
                  <Text style={styles.actionButtonText}>
                    {bookedSeats > 0 ? 'Has Passengers' : 'Cancel'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {item.status === 'in_progress' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleStatusUpdate(item, 'completed')}
                disabled={isActionLoading}
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.actionButtonText}>Complete Trip</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Trip metadata */}
        <View style={styles.tripMeta}>
          <Text style={styles.metaText}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          {item.actualDepartureTime && (
            <Text style={styles.metaText}>
              Started: {formatDateTime(item.actualDepartureTime).time}
            </Text>
          )}
          {item.actualArrivalTime && (
            <Text style={styles.metaText}>
              Completed: {formatDateTime(item.actualArrivalTime).time}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Filter buttons
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  // Calculate summary stats
  const summaryStats = {
    total: trips.length,
    scheduled: trips.filter(t => t.status === 'scheduled').length,
    inProgress: trips.filter(t => t.status === 'in_progress').length,
    completed: trips.filter(t => t.status === 'completed').length,
    totalEarnings: trips
      .filter(t => t.status === 'completed')
      .reduce((sum, trip) => sum + calculateTripEarnings(trip), 0),
  };

  // ✅ FIXED: Better loading state
  if (loading && trips.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading your trips...</Text>
        <Text style={styles.debugText}>Filter: {activeFilter}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{summaryStats.total}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{summaryStats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              ${summaryStats.totalEarnings.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {summaryStats.scheduled + summaryStats.inProgress}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === item.key && styles.filterButtonActive,
              ]}
              onPress={() => handleFilterChange(item.key)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === item.key && styles.filterButtonTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Debug Info */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            🐛 Debug: {trips.length} trips | Filter: {activeFilter} | Loading: {loading.toString()}
          </Text>
        </View>
      )}

      {/* Trips List */}
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTripItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTrips(true)}
            colors={['#007bff']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyText}>No trips found</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === 'all'
                ? "You haven't created any trips yet"
                : `No ${activeFilter} trips found`}
            </Text>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => fetchTrips(true)}
            >
              <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={trips.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  debugText: {
    marginTop: 8,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  debugContainer: {
    backgroundColor: '#fff3cd',
    padding: 8,
    margin: 16,
    borderRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  tripCard: {
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorCard: {
    backgroundColor: '#ffebee',
    margin: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 12,
    color: '#c62828',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeSection: {
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  routeDetails: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeSection: {
    flex: 1,
    alignItems: 'center',
  },
  capacitySection: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#eee',
  },
  earningsSection: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  capacityLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  capacityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  capacityPercent: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  earningsLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
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
  tripMeta: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#888',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});