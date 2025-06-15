// app/(tabs)/passenger/SearchScreen.tsx
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDestinations, getTrips, type Destination, type Trip } from '../../../src/services/api';

export default function SearchScreen() {
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

  // Fetch destinations for this station
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const response = await getDestinations(stationId);
        
        if (response.success) {
          setDestinations(response.destinations || []);
        } else {
          Alert.alert('Error', 'Failed to load destinations');
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

  // Search for trips when destination is selected
  const searchTrips = async (destination: Destination) => {
    try {
      setSearchingTrips(true);
      setSelectedDestination(destination);
      
      const response = await getTrips({
        destinationId: destination.id,
        status: 'scheduled',
        page: 1,
        limit: 20
      });
      
      if (response.success) {
        setTrips(response.trips || []);
        if (response.trips.length === 0) {
          Alert.alert('No Trips', 'No available trips found for this route.');
        }
      } else {
        Alert.alert('Error', 'Failed to search trips');
      }
    } catch (error) {
      console.error('Error searching trips:', error);
      Alert.alert('Error', 'Failed to search trips');
    } finally {
      setSearchingTrips(false);
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate duration
  const calculateDuration = (departure: string, arrival: string) => {
    const diff = new Date(arrival).getTime() - new Date(departure).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Navigate to booking screen
  const selectTrip = (trip: Trip) => {
    router.push({
      pathname: '/(tabs)/passenger/BookingScreen',
      params: { 
        tripId: trip.id,
        tripData: JSON.stringify(trip)
      }
    });
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
        <Text style={styles.title}>Search Trips</Text>
        <Text style={styles.subtitle}>From: {stationName}</Text>
      </View>

      {!selectedDestination ? (
        <>
          <Text style={styles.sectionTitle}>Select Destination:</Text>
          <FlatList
            data={destinations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.destinationCard}
                onPress={() => searchTrips(item)}
              >
                <Text style={styles.destinationName}>{item.description}</Text>
                <Text style={styles.destinationDetails}>
                  To: {item.endStation.name}, {item.endStation.city}
                </Text>
                <View style={styles.destinationMeta}>
                  <Text style={styles.price}>From ${item.basePrice}</Text>
                  <Text style={styles.duration}>{item.estimatedDuration} min</Text>
                </View>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <>
          <View style={styles.selectedRoute}>
            <Text style={styles.routeText}>
              {stationName} → {selectedDestination.endStation.name}
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
              <Text style={styles.loadingText}>Searching trips...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Available Trips:</Text>
              <FlatList
                data={trips}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.tripCard}
                    onPress={() => selectTrip(item)}
                    disabled={item.availableSeats === 0}
                  >
                    <View style={styles.tripHeader}>
                      <Text style={styles.tripTime}>
                        {formatTime(item.departureTime)}
                      </Text>
                      <Text style={styles.tripDate}>
                        {formatDate(item.departureTime)}
                      </Text>
                    </View>
                    
                    <View style={styles.tripDetails}>
                      <Text style={styles.driverName}>
                        Driver: {item.driver.user.username}
                      </Text>
                      <Text style={styles.vehicleInfo}>
                        {item.driver.vehicleType || 'Vehicle'} • {item.capacity} seats
                      </Text>
                      <Text style={styles.duration}>
                        Duration: {calculateDuration(item.departureTime, item.estimatedArrivalTime)}
                      </Text>
                    </View>

                    <View style={styles.tripFooter}>
                      <View style={styles.seatsInfo}>
                        <Text style={[
                          styles.seatsText, 
                          item.availableSeats === 0 && styles.soldOut
                        ]}>
                          {item.availableSeats > 0 
                            ? `${item.availableSeats} seats left` 
                            : 'Sold Out'
                          }
                        </Text>
                        <Text style={styles.rating}>
                          ⭐ {item.driver.rating.toFixed(1)}
                        </Text>
                      </View>
                      <Text style={styles.price}>${item.currentPrice.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No trips available</Text>
                    <Text style={styles.emptySubtext}>
                      Try selecting a different destination or check back later
                    </Text>
                  </View>
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
    padding: 16,
  },
  header: {
    marginBottom: 20,
    paddingTop: 40,
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
    marginBottom: 12,
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
    borderRadius: 8,
    marginBottom: 16,
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
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  tripDetails: {
    marginBottom: 12,
  },
  driverName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seatsInfo: {
    flex: 1,
  },
  seatsText: {
    fontSize: 14,
    color: '#666',
  },
  soldOut: {
    color: '#ff4444',
    fontWeight: '600',
  },
  rating: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
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
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});
