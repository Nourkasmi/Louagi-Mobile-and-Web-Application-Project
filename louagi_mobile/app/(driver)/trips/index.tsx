// 📁 app/(driver)/trips/index.tsx - FIXED Trip Actions
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
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
import { styles } from './index.style';
import { theme } from '../../../src/styles/theme';

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

      const response = await getDriverTrips({
        status: activeFilter === 'all' ? undefined : activeFilter,
        limit: 50,
      });

      if (response.success) {
        let tripsData: Trip[] = [];

        if (response.data?.trips) {
          tripsData = response.data.trips;
        } else if (response.trips) {
          tripsData = response.trips;
        } else if (Array.isArray(response.data)) {
          tripsData = response.data;
        }

        console.log(`✅ Processed ${tripsData.length} trips`);
        setTrips(tripsData);
      } else {
        setTrips([]);
        Alert.alert('Error', response.message || 'Failed to load trips');
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
      setTrips([]);
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  // Initial load and when filter changes
  useEffect(() => {
    fetchTrips();
  }, [activeFilter, fetchTrips]);

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  // 🔧 FIXED: Handle trip status update with debouncing and better web compatibility
  const handleStatusUpdate = async (trip: Trip, newStatus: Trip['status']) => {
    // Prevent multiple simultaneous actions on the same trip
    if (actionLoading === trip.id) {
      console.log('⚠️ Action already in progress for trip:', trip.id);
      return;
    }

    // Special validation for cancelling trips with passengers
    if (newStatus === 'cancelled') {
      const bookedSeats = trip.capacity - trip.availableSeats;
      if (bookedSeats > 0) {
        if (typeof window !== 'undefined' && window.confirm) {
          // Web fallback
          window.alert(`Cannot Cancel Trip\n\nThis trip has ${bookedSeats} passenger${bookedSeats > 1 ? 's' : ''} booked. You cannot cancel a trip with active bookings.`);
        } else {
          Alert.alert(
            'Cannot Cancel Trip',
            `This trip has ${bookedSeats} passenger${bookedSeats > 1 ? 's' : ''} booked. You cannot cancel a trip with active bookings.`,
            [{ text: 'OK' }]
          );
        }
        return;
      }
    }

    const actionName = newStatus === 'in_progress' ? 'start' :
      newStatus === 'completed' ? 'complete' :
        newStatus === 'cancelled' ? 'cancel' : 'update';

    // Web-compatible confirmation
    const confirmAction = async (): Promise<boolean> => {
      if (typeof window !== 'undefined' && window.confirm) {
        return window.confirm(`Are you sure you want to ${actionName} this trip?`);
      } else {
        return new Promise((resolve) => {
          Alert.alert(
            `${actionName.charAt(0).toUpperCase() + actionName.slice(1)} Trip`,
            `Are you sure you want to ${actionName} this trip?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              {
                text: 'Confirm',
                style: newStatus === 'cancelled' ? 'destructive' : 'default',
                onPress: () => resolve(true)
              },
            ]
          );
        });
      }
    };

    const confirmed = await confirmAction();
    if (!confirmed) {
      console.log('🚫 Action cancelled by user');
      return;
    }

    // Execute the action
    try {
      console.log(`🚀 ${actionName.charAt(0).toUpperCase() + actionName.slice(1)}ing trip:`, trip.id);
      setActionLoading(trip.id);

      let response;

      // Use different API endpoints based on the action
      if (newStatus === 'completed') {
        response = await completeTrip(trip.id);
      } else {
        response = await updateTripStatus(trip.id, newStatus);
      }

      console.log('📡 API Response:', response);

      if (response.success) {
        // Show success message
        const successMessage = `Trip ${newStatus === 'in_progress' ? 'started' : newStatus} successfully!`;

        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`Success\n\n${successMessage}`);
        } else {
          Alert.alert('Success', successMessage, [{ text: 'OK' }]);
        }

        // Refresh the trips list to show updated status
        console.log('🔄 Refreshing trips list...');
        await fetchTrips(true);
      } else {
        // Handle API error response
        const errorMessage = response.message ||
          response.error?.message ||
          `Failed to ${actionName} trip. Please try again.`;

        console.error('❌ API Error:', errorMessage);

        if (typeof window !== 'undefined' && window.alert) {
          window.alert(`Error\n\n${errorMessage}`);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (error: any) {
      console.error(`❌ ${actionName.charAt(0).toUpperCase() + actionName.slice(1)} trip error:`, error);

      // Enhanced error handling
      let errorMessage = `Failed to ${actionName} trip. `;

      if (error.response?.status === 400) {
        errorMessage += error.response?.data?.message || 'Invalid request.';
      } else if (error.response?.status === 404) {
        errorMessage += 'Trip not found.';
      } else if (error.response?.status === 409) {
        errorMessage += 'Trip cannot be updated in its current state.';
      } else if (error.response?.status >= 500) {
        errorMessage += 'Server error. Please try again in a moment.';
      } else if (!error.response) {
        errorMessage += 'Please check your internet connection.';
      } else {
        errorMessage += 'Please try again.';
      }

      if (typeof window !== 'undefined' && window.alert) {
        window.alert(`Update Failed\n\n${errorMessage}`);
      } else {
        Alert.alert('Update Failed', errorMessage);
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Helper functions using theme
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

  // Get status color using theme
  const getStatusColor = (status: Trip['status']) => {
    switch (status) {
      case 'scheduled': return theme.colors.status.scheduled;
      case 'in_progress': return theme.colors.status.inProgress;
      case 'completed': return theme.colors.status.completed;
      case 'cancelled': return theme.colors.status.cancelled;
      default: return theme.colors.status.noShow;
    }
  };

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

  // Render trip item with improved action buttons
  const renderTripItem = ({ item }: { item: Trip }) => {
    // Defensive validation
    if (!item || !item.route) {
      return (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ Trip data incomplete</Text>
          <Text style={styles.errorSubtext}>Trip ID: {item?.id || 'Unknown'}</Text>
        </View>
      );
    }

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

        {/* 🔧 IMPROVED: Action buttons with debouncing and web compatibility */}
        {(item.status === 'scheduled' || item.status === 'in_progress') && (
          <View style={styles.actionButtons}>
            {item.status === 'scheduled' && (
              <>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.startButton,
                    isActionLoading && styles.disabledButton
                  ]}
                  onPress={() => {
                    console.log('🔥 Start button pressed for trip:', item.id);
                    handleStatusUpdate(item, 'in_progress');
                  }}
                  disabled={isActionLoading}
                  activeOpacity={isActionLoading ? 1 : 0.7}
                >
                  {isActionLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.actionButtonText}>Start Trip</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    bookedSeats > 0 ? styles.disabledButton : styles.cancelButton
                  ]}
                  onPress={() => {
                    console.log('🔥 Cancel button pressed for trip:', item.id);
                    if (bookedSeats === 0) {
                      handleStatusUpdate(item, 'cancelled');
                    }
                  }}
                  disabled={isActionLoading || bookedSeats > 0}
                  activeOpacity={isActionLoading || bookedSeats > 0 ? 1 : 0.7}
                >
                  <Text style={styles.actionButtonText}>
                    {bookedSeats > 0 ? `${bookedSeats} Passengers` : 'Cancel Trip'}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {item.status === 'in_progress' && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.completeButton,
                  isActionLoading && styles.disabledButton
                ]}
                onPress={() => {
                  console.log('🔥 Complete button pressed for trip:', item.id);
                  handleStatusUpdate(item, 'completed');
                }}
                disabled={isActionLoading}
                activeOpacity={isActionLoading ? 1 : 0.7}
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

  if (loading && trips.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your trips...</Text>
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

      {/* Trips List */}
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTripItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchTrips(true)}
            colors={[theme.colors.primary]}
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

// 🎯 TRIP ACTION FIXES IMPLEMENTED:
// 
// ✅ PREVENTED DUPLICATE ACTIONS: actionLoading state prevents multiple simultaneous updates
// ✅ PROPER ERROR HANDLING: Comprehensive error messages for different scenarios
// ✅ UI FEEDBACK: Loading states and clear success/error messages
// ✅ VALIDATION: Prevent cancelling trips with active passengers
// ✅ API RESPONSE HANDLING: Better parsing of API responses
// ✅ CONSOLE LOGGING: Enhanced debugging information
// ✅ USER EXPERIENCE: Clear confirmation dialogs and feedback