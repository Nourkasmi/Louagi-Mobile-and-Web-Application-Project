// 📁 app/(passenger)/search/index.tsx - COMPLETE FIXED VERSION
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  getDestinations,
  getTrips,
  type Destination,
  type Trip
} from '../../../src/services/api';
import { styles } from './index.style';
import { theme } from '../../../src/styles/theme';

export default function PassengerSearchScreen() {
  const { stationId, stationName } = useLocalSearchParams<{
    stationId: string;
    stationName: string;
  }>();

  const router = useRouter();

  // State management
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchingTrips, setSearchingTrips] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch destinations for this station
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);

        const response = await getDestinations(stationId, { limit: 50 });

        let dests = [];
        if (response.success) {
          if (response.data?.destinations) {
            dests = response.data.destinations;
          } else if (response.destinations) {
            dests = response.destinations;
          }
        }

        setDestinations(dests);

        if (!response.success || dests.length === 0) {
          Alert.alert('Info', 'No destinations available for this station');
        }
      } catch (error) {
        console.error('Error fetching destinations:', error);
        Alert.alert('Error', 'Failed to load destinations');
      } finally {
        setLoading(false);
      }
    };

    if (stationId) {
      fetchDestinations();
    }
  }, [stationId]);

  // Search trips function
  const searchTrips = useCallback(async (destination: Destination, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setSearchingTrips(true);
      }

      setSelectedDestination(destination);

      // API call with destinationId
      const response = await getTrips({
        destinationId: destination.id,
        status: 'scheduled',
        page: 1,
        limit: 20
      });

      let tripList = [];

      // Handle multiple possible response structures
      if (response.success) {
        if (response.data?.trips) {
          tripList = response.data.trips;
        } else if (response.trips) {
          tripList = response.trips;
        } else if (response.data?.data?.trips) {
          tripList = response.data.data.trips;
        } else if (Array.isArray(response.data)) {
          tripList = response.data;
        }

        // Filter for available seats
        const availableTrips = Array.isArray(tripList) ?
          tripList.filter(trip => trip.availableSeats > 0) : [];

        setTrips(availableTrips);

        if (availableTrips.length === 0 && tripList.length > 0) {
          Alert.alert(
            'Trips Found But Full',
            `Found ${tripList.length} trip(s), but all seats are booked. New trips are created when drivers declare availability.`
          );
        } else if (availableTrips.length === 0) {
          Alert.alert(
            'No Available Trips',
            'No trips with available seats found for this route. New trips are created automatically when drivers declare availability.'
          );
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to search trips');
        setTrips([]);
      }
    } catch (error) {
      console.error('Error searching trips:', error);
      Alert.alert('Error', 'Failed to search trips');
      setTrips([]);
    } finally {
      setSearchingTrips(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh trips every 30 seconds for real-time updates
  useEffect(() => {
    if (selectedDestination) {
      const interval = setInterval(() => {
        searchTrips(selectedDestination, true);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [selectedDestination, searchTrips]);

  // Helper functions using theme
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'When full';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Today';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get trip status info with theme colors
  const getTripStatusInfo = (trip: Trip) => {
    const bookedSeats = trip.capacity - trip.availableSeats;
    const percentageFull = Math.round((bookedSeats / trip.capacity) * 100);

    if (percentageFull === 100) {
      return {
        text: 'Starting Soon! 🚀',
        color: theme.colors.status.completed,
        urgent: true
      };
    } else if (percentageFull >= 75) {
      return {
        text: 'Almost Full!',
        color: theme.colors.status.pending,
        urgent: true
      };
    } else if (percentageFull >= 50) {
      return {
        text: 'Filling Up',
        color: theme.colors.status.inProgress,
        urgent: false
      };
    } else {
      return {
        text: 'Available',
        color: theme.colors.status.noShow,
        urgent: false
      };
    }
  };

  // 🔧 FIXED: Navigate to booking screen with complete data validation
  const selectTrip = (trip: Trip) => {
    try {
      console.log('🚗 Selecting trip for booking:', {
        tripId: trip.id,
        stationId,
        stationName,
        selectedDestination: selectedDestination?.id
      });

      // 🔧 FIXED: Validate trip data before navigation
      if (!trip || !trip.id) {
        Alert.alert('Error', 'Invalid trip data. Please try again.');
        return;
      }

      if (!trip.route) {
        Alert.alert('Error', 'Trip route information is missing. Please try again.');
        return;
      }

      // 🔧 FIXED: Ensure route data is complete with all required fields
      const completeTrip = {
        ...trip,
        // Ensure all required trip fields
        id: trip.id,
        capacity: trip.capacity || 4,
        availableSeats: trip.availableSeats || 0,
        status: trip.status || 'scheduled',
        basePrice: trip.basePrice || '10.00',
        currentPrice: trip.currentPrice || trip.basePrice || '10.00',
        departureTime: trip.departureTime,
        estimatedArrivalTime: trip.estimatedArrivalTime,
        notes: trip.notes || '',
        createdAt: trip.createdAt || new Date().toISOString(),
        updatedAt: trip.updatedAt || new Date().toISOString(),

        // Complete route information
        route: {
          id: trip.route?.id || `route_${trip.id}`,
          startId: trip.route?.startId || stationId || '',
          endId: trip.route?.endId || selectedDestination?.endStation?.id || selectedDestination?.id || '',
          distance: trip.route?.distance || 0,
          basePrice: trip.route?.basePrice || trip.basePrice || '10.00',
          estimatedDuration: trip.route?.estimatedDuration || 60,
          isActive: trip.route?.isActive ?? true,
          description: trip.route?.description || selectedDestination?.description || `${stationName} to ${selectedDestination?.endStation?.name || 'Destination'}`,
          createdAt: trip.route?.createdAt || new Date().toISOString(),
          updatedAt: trip.route?.updatedAt || new Date().toISOString(),

          // Complete start station
          startStation: {
            id: trip.route?.startStation?.id || stationId || '',
            name: trip.route?.startStation?.name || stationName || 'Departure Station',
            address: trip.route?.startStation?.address || '',
            city: trip.route?.startStation?.city || '',
            state: trip.route?.startStation?.state || '',
            zipCode: trip.route?.startStation?.zipCode || '',
            capacity: trip.route?.startStation?.capacity || 100,
            isActive: trip.route?.startStation?.isActive ?? true,
            contactPhone: trip.route?.startStation?.contactPhone || '',
            contactEmail: trip.route?.startStation?.contactEmail || '',
            amenities: trip.route?.startStation?.amenities || {},
          },

          // Complete end station
          endStation: {
            id: trip.route?.endStation?.id || selectedDestination?.endStation?.id || selectedDestination?.id || '',
            name: trip.route?.endStation?.name || selectedDestination?.endStation?.name || selectedDestination?.description || 'Destination Station',
            address: trip.route?.endStation?.address || selectedDestination?.endStation?.address || '',
            city: trip.route?.endStation?.city || selectedDestination?.endStation?.city || '',
            state: trip.route?.endStation?.state || selectedDestination?.endStation?.state || '',
            zipCode: trip.route?.endStation?.zipCode || selectedDestination?.endStation?.zipCode || '',
            capacity: trip.route?.endStation?.capacity || 100,
            isActive: trip.route?.endStation?.isActive ?? true,
            contactPhone: trip.route?.endStation?.contactPhone || '',
            contactEmail: trip.route?.endStation?.contactEmail || '',
            amenities: trip.route?.endStation?.amenities || {},
          },
        },

        // Include driver info if available
        driver: trip.driver || null,
        schedule: trip.schedule || null,
        queueEntry: trip.queueEntry || null,
        bookings: trip.bookings || [],
      };

      // 🔧 FIXED: Validate complete trip before navigation
      if (!completeTrip.route.startStation.name || !completeTrip.route.endStation.name) {
        Alert.alert('Error', 'Trip route information is incomplete. Please try again.');
        return;
      }

      // 🔧 FIXED: Convert to string safely with error handling
      let tripDataString: string;
      try {
        tripDataString = JSON.stringify(completeTrip);
      } catch (stringifyError) {
        console.error('❌ Error stringifying trip data:', stringifyError);
        Alert.alert('Error', 'Unable to process trip data. Please try again.');
        return;
      }

      console.log('✅ Complete trip data prepared for booking:', {
        tripId: completeTrip.id,
        route: `${completeTrip.route.startStation.name} → ${completeTrip.route.endStation.name}`,
        capacity: completeTrip.capacity,
        availableSeats: completeTrip.availableSeats,
        price: completeTrip.currentPrice,
        dataSize: tripDataString.length,
        hasDriver: !!completeTrip.driver,
        hasSchedule: !!completeTrip.schedule
      });

      // 🔧 FIXED: Navigate with complete and validated data
      router.push({
        pathname: '/(passenger)/booking',
        params: {
          tripId: completeTrip.id,
          tripData: tripDataString
        }
      });

    } catch (error) {
      console.error('❌ Error navigating to booking:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to open booking screen. Please try selecting the trip again.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  };

  // Render destination item
  const renderDestinationItem = ({ item }: { item: Destination }) => (
    <TouchableOpacity
      style={styles.destinationCard}
      onPress={() => searchTrips(item)}
    >
      <Text style={styles.destinationName}>{item.description}</Text>
      <Text style={styles.destinationDetails}>
        To: {item.endStation?.name || 'Unknown'}, {item.endStation?.city || 'Unknown'}
      </Text>
      <View style={styles.destinationMeta}>
        <Text style={styles.price}>From ${item.basePrice}</Text>
        <Text style={styles.duration}>{item.estimatedDuration} min</Text>
      </View>
    </TouchableOpacity>
  );

  // Enhanced trip item rendering with theme
  const renderTripItem = ({ item }: { item: Trip }) => {
    const bookedSeats = item.capacity - item.availableSeats;
    const statusInfo = getTripStatusInfo(item);
    const pricePerSeat = (item.currentPrice / item.capacity);

    return (
      <TouchableOpacity
        style={[
          styles.tripCard,
          statusInfo.urgent && styles.urgentTripCard
        ]}
        onPress={() => selectTrip(item)}
        disabled={item.availableSeats === 0}
      >
        {/* Trip Header */}
        <View style={styles.tripHeader}>
          <View style={styles.timeContainer}>
            <Text style={styles.tripTime}>
              {formatTime(item.departureTime)}
            </Text>
            <Text style={styles.tripDate}>
              {formatDate(item.departureTime)}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        </View>

        {/* Capacity Visual */}
        <View style={styles.capacitySection}>
          <View style={styles.capacityHeader}>
            <Text style={styles.capacityLabel}>Seats</Text>
            <Text style={styles.capacityCount}>
              {bookedSeats}/{item.capacity} filled
            </Text>
          </View>

          <View style={styles.capacityBar}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${(bookedSeats / item.capacity) * 100}%`,
                  backgroundColor: statusInfo.color
                }
              ]}
            />
          </View>

          <View style={styles.seatIndicators}>
            {Array.from({ length: item.capacity }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.seatIndicator,
                  index < bookedSeats ? styles.bookedSeat : styles.availableSeat
                ]}
              />
            ))}
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.tripDetails}>
          <View style={styles.driverSection}>
            <Text style={styles.driverName}>
              🚗 {item.driver?.user?.username || 'Unknown Driver'}
            </Text>
            <Text style={styles.vehicleInfo}>
              {item.driver?.vehicleType || 'Vehicle'} • ⭐ {item.driver?.rating?.toFixed(1) || '5.0'}
            </Text>
          </View>

          <Text style={styles.durationText}>
            ⏱️ {item.route?.estimatedDuration || 90} min trip
          </Text>
        </View>

        {/* Price and Book Button */}
        <View style={styles.tripFooter}>
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Price per seat</Text>
            <Text style={styles.price}>${pricePerSeat.toFixed(2)}</Text>
          </View>

          <View style={styles.bookSection}>
            <Text style={styles.availableSeats}>
              {item.availableSeats} seat{item.availableSeats !== 1 ? 's' : ''} left
            </Text>
            {statusInfo.urgent && (
              <Text style={styles.urgentText}>Book now!</Text>
            )}
          </View>
        </View>

        {/* Auto-start indicator */}
        {!item.departureTime && (
          <View style={styles.autoStartIndicator}>
            <Text style={styles.autoStartText}>
              🚀 Starts automatically when full
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading destinations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Search Trips</Text>
        <Text style={styles.subtitle}>From: {stationName}</Text>
      </View>

      {!selectedDestination ? (
        <>
          <Text style={styles.sectionTitle}>Select Destination:</Text>
          <FlatList
            data={destinations}
            keyExtractor={(item) => item.id}
            renderItem={renderDestinationItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🎯</Text>
                <Text style={styles.emptyText}>No destinations available</Text>
                <Text style={styles.emptySubtext}>
                  No routes are configured from this station yet.
                </Text>
              </View>
            }
          />
        </>
      ) : (
        <>
          <View style={styles.selectedRoute}>
            <Text style={styles.routeText}>
              {stationName} → {selectedDestination.endStation?.name || 'Unknown'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedDestination(null);
                setTrips([]);
              }}
              style={styles.changeButton}
            >
              <Text style={styles.changeButtonText}>Change Route</Text>
            </TouchableOpacity>
          </View>

          {searchingTrips ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Searching available trips...</Text>
            </View>
          ) : (
            <>
              <View style={styles.tripListHeader}>
                <Text style={styles.sectionTitle}>Available Trips:</Text>
                <TouchableOpacity
                  onPress={() => searchTrips(selectedDestination, true)}
                  style={styles.refreshButton}
                >
                  <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={trips}
                keyExtractor={(item) => item.id}
                renderItem={renderTripItem}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => searchTrips(selectedDestination, true)}
                    colors={[theme.colors.primary]}
                  />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🚐</Text>
                    <Text style={styles.emptyText}>No trips available right now</Text>
                    <Text style={styles.emptySubtext}>
                      Trips are created when drivers declare availability.{'\n'}
                      Pull to refresh or try again in a few minutes.
                    </Text>
                    <TouchableOpacity
                      style={styles.refreshEmptyButton}
                      onPress={() => searchTrips(selectedDestination, true)}
                    >
                      <Text style={styles.refreshEmptyButtonText}>🔄 Check Again</Text>
                    </TouchableOpacity>
                  </View>
                }
                ListHeaderComponent={
                  trips.length > 0 ? (
                    <View style={styles.tripsTip}>
                      <Text style={styles.tipText}>
                        💡 Trips fill up fast! Book early to secure your seat.
                      </Text>
                    </View>
                  ) : null
                }
              />
            </>
          )}
        </>
      )}
    </View>
  );
}