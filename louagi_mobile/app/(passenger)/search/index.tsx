// app/(passenger)/search/index.tsx - COMPLETE WORKING VERSION WITH NAVIGATION FIX
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  getDestinations, 
  getTrips, 
  type Destination, 
  type Trip 
} from '../../../src/services/api';

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

  // THE WORKING TRIP SEARCH FUNCTION - Enhanced with multiple response structure handling
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
      
      // 🔧 CRITICAL FIX: Handle multiple possible response structures
      if (response.success) {
        // Try different possible structures based on your working code
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

  // Format time for display
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'When full';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Today';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get trip status info
  const getTripStatusInfo = (trip: Trip) => {
    const bookedSeats = trip.capacity - trip.availableSeats;
    const percentageFull = Math.round((bookedSeats / trip.capacity) * 100);
    
    if (percentageFull === 100) {
      return { 
        text: 'Starting Soon! 🚀', 
        color: '#28a745', 
        urgent: true 
      };
    } else if (percentageFull >= 75) {
      return { 
        text: 'Almost Full!', 
        color: '#ffc107', 
        urgent: true 
      };
    } else if (percentageFull >= 50) {
      return { 
        text: 'Filling Up', 
        color: '#007bff', 
        urgent: false 
      };
    } else {
      return { 
        text: 'Available', 
        color: '#6c757d', 
        urgent: false 
      };
    }
  };

  // 🔧 FIXED: Navigate to booking screen with comprehensive error handling and data validation
  const selectTrip = (trip: Trip) => {
    try {
      console.log('🚗 Original trip data:', trip);
      
      // Validate trip data before navigation
      if (!trip || !trip.id) {
        Alert.alert('Error', 'Invalid trip data. Please try again.');
        return;
      }

      // Create a safe trip object with all required properties
      const safeTrip = {
        id: trip.id,
        routeId: trip.routeId || '',
        scheduleId: trip.scheduleId || '',
        driverId: trip.driverId || '',
        capacity: trip.capacity || 4,
        availableSeats: trip.availableSeats || 0,
        status: trip.status || 'scheduled',
        departureTime: trip.departureTime || null,
        estimatedArrivalTime: trip.estimatedArrivalTime || null,
        actualDepartureTime: trip.actualDepartureTime || null,
        actualArrivalTime: trip.actualArrivalTime || null,
        basePrice: trip.basePrice || 0,
        currentPrice: trip.currentPrice || trip.basePrice || 0,
        notes: trip.notes || null,
        createdAt: trip.createdAt || new Date().toISOString(),
        updatedAt: trip.updatedAt || new Date().toISOString(),
        
        // Safe route object
        route: {
          id: trip.route?.id || selectedDestination?.id || '',
          startId: trip.route?.startId || stationId || '',
          endId: trip.route?.endId || selectedDestination?.endId || '',
          distance: trip.route?.distance || 0,
          basePrice: trip.route?.basePrice || selectedDestination?.basePrice || 0,
          estimatedDuration: trip.route?.estimatedDuration || selectedDestination?.estimatedDuration || 90,
          isActive: trip.route?.isActive || true,
          description: trip.route?.description || selectedDestination?.description || 'Trip route',
          
          // Safe start station
          startStation: {
            id: trip.route?.startStation?.id || stationId || '',
            name: trip.route?.startStation?.name || stationName || 'Departure Station',
            address: trip.route?.startStation?.address || 'Unknown Address',
            city: trip.route?.startStation?.city || 'Unknown City',
            state: trip.route?.startStation?.state || 'Tunisia',
            zipCode: trip.route?.startStation?.zipCode || '00000',
            capacity: trip.route?.startStation?.capacity || 100,
            isActive: trip.route?.startStation?.isActive || true,
            contactPhone: trip.route?.startStation?.contactPhone || null,
            contactEmail: trip.route?.startStation?.contactEmail || null,
            amenities: trip.route?.startStation?.amenities || {}
          },
          
          // Safe end station
          endStation: {
            id: trip.route?.endStation?.id || selectedDestination?.endStation?.id || '',
            name: trip.route?.endStation?.name || selectedDestination?.endStation?.name || 'Destination Station',
            address: trip.route?.endStation?.address || selectedDestination?.endStation?.address || 'Unknown Address',
            city: trip.route?.endStation?.city || selectedDestination?.endStation?.city || 'Unknown City',
            state: trip.route?.endStation?.state || 'Tunisia',
            zipCode: trip.route?.endStation?.zipCode || '00000',
            capacity: trip.route?.endStation?.capacity || 100,
            isActive: trip.route?.endStation?.isActive || true,
            contactPhone: trip.route?.endStation?.contactPhone || null,
            contactEmail: trip.route?.endStation?.contactEmail || null,
            amenities: trip.route?.endStation?.amenities || {}
          }
        },
        
        // Safe driver object
        driver: {
          id: trip.driver?.id || '',
          licenseNo: trip.driver?.licenseNo || 'Unknown',
          licenseExpiry: trip.driver?.licenseExpiry || '2030-01-01',
          experience: trip.driver?.experience || 5,
          rating: trip.driver?.rating || 5.0,
          vehicleType: trip.driver?.vehicleType || 'Vehicle',
          vehicleCapacity: trip.driver?.vehicleCapacity || trip.capacity || 4,
          isVerified: trip.driver?.isVerified || true,
          isAvailable: trip.driver?.isAvailable || true,
          documents: trip.driver?.documents || {},
          
          // Safe user object for driver
          user: {
            id: trip.driver?.user?.id || '',
            username: trip.driver?.user?.username || 'Unknown Driver',
            email: trip.driver?.user?.email || 'driver@louagi.com',
            phone: trip.driver?.user?.phone || '+216 XX XXX XXX',
            role: 'driver' as const,
            isActive: trip.driver?.user?.isActive || true,
            profileImage: trip.driver?.user?.profileImage || null,
            createdAt: trip.driver?.user?.createdAt || new Date().toISOString(),
            updatedAt: trip.driver?.user?.updatedAt || new Date().toISOString()
          }
        },
        
        // Safe schedule object (optional)
        schedule: trip.schedule || {
          id: '',
          stationId: stationId || '',
          dayOfWeek: new Date().getDay(),
          startTime: '06:00',
          endTime: '20:00',
          isActive: true,
          maxTrips: 10,
          notes: null,
          station: {
            id: stationId || '',
            name: stationName || 'Station',
            address: 'Unknown',
            city: 'Unknown',
            state: 'Tunisia',
            zipCode: '00000',
            capacity: 100,
            isActive: true,
            contactPhone: null,
            contactEmail: null,
            amenities: {}
          }
        }
      };

      console.log('🚗 Safe trip data created:', safeTrip.id);
      console.log('📍 Route:', safeTrip.route.startStation.name, '→', safeTrip.route.endStation.name);
      
      router.push({
        pathname: '/(passenger)/booking',
        params: { 
          tripId: safeTrip.id,
          tripData: JSON.stringify(safeTrip)
        }
      });
    } catch (error) {
      console.error('Error navigating to booking:', error);
      Alert.alert('Navigation Error', 'Unable to open booking screen. Please try again.');
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

  // Enhanced trip item rendering
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
        <ActivityIndicator size="large" color="#0066cc" />
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
              <ActivityIndicator size="large" color="#0066cc" />
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
                    colors={['#0066cc']}
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
  header: {
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    margin: 16,
    marginBottom: 12,
  },
  listContainer: {
    padding: 16,
  },
  destinationCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  destinationDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  destinationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  duration: {
    fontSize: 14,
    color: '#888',
  },
  selectedRoute: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  changeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0066cc',
    borderRadius: 6,
  },
  changeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tripListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#28a745',
    borderRadius: 6,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tripsTip: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  tipText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  tripCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentTripCard: {
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flex: 1,
  },
  tripTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tripDate: {
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
  capacitySection: {
    marginBottom: 12,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  capacityLabel: {
    fontSize: 14,
    color: '#666',
  },
  capacityCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  capacityBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    marginBottom: 8,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 3,
  },
  seatIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  seatIndicator: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  bookedSeat: {
    backgroundColor: '#007bff',
  },
  availableSeat: {
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  tripDetails: {
    marginBottom: 12,
  },
  driverSection: {
    marginBottom: 4,
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 12,
    color: '#666',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  bookSection: {
    alignItems: 'flex-end',
  },
  availableSeats: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  urgentText: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '600',
  },
  autoStartIndicator: {
    backgroundColor: '#d4edda',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  autoStartText: {
    fontSize: 12,
    color: '#155724',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshEmptyButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshEmptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});