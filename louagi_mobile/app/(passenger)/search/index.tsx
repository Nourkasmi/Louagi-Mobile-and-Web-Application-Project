// app/(passenger)/search/index.tsx 

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {
  getStations,
  getDestinations,
  type Station,
  type Destination
} from '../../../src/services/api';
import { theme } from '../../../src/styles/theme';

export default function StationSearchScreen() {
  const { selectedStationId, selectedStationName } = useLocalSearchParams<{
    selectedStationId?: string;
    selectedStationName?: string;
  }>();

  const router = useRouter();

  // State management
  const [stations, setStations] = useState<Station[]>([]);
  const [filteredStations, setFilteredStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [step, setStep] = useState<'stations' | 'destinations'>('stations');

  // Check if we need to auto-select a station from home screen
  useEffect(() => {
    if (selectedStationId && selectedStationName) {
      // Find the station and auto-navigate to destinations
      const autoSelectedStation: Station = {
        id: selectedStationId,
        name: selectedStationName,
        address: '',
        city: '',
        state: '',
        zipCode: '',
        capacity: 100,
        isActive: true,
        amenities: {},
      };
      fetchDestinations(autoSelectedStation);
    }
  }, [selectedStationId, selectedStationName]);

  // Fetch all stations
  const fetchStations = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await getStations({ limit: 100 });

      let stationsList = [];
      if (response.success) {
        if (response.data?.stations) {
          stationsList = response.data.stations;
        } else if (response.stations) {
          stationsList = response.stations;
        }
      }

      setStations(stationsList);
      setFilteredStations(stationsList);

      if (!response.success || stationsList.length === 0) {
        Alert.alert('Info', 'No stations available at the moment');
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      Alert.alert('Error', 'Failed to load stations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch destinations for selected station
  const fetchDestinations = useCallback(async (station: Station) => {
    try {
      setLoading(true);
      setSelectedStation(station);
      setStep('destinations');

      const response = await getDestinations(station.id, { limit: 50 });

      let destinationsList = [];
      if (response.success) {
        if (response.data?.destinations) {
          destinationsList = response.data.destinations;
        } else if (response.destinations) {
          destinationsList = response.destinations;
        }
      }

      setDestinations(destinationsList);

      if (!response.success || destinationsList.length === 0) {
        Alert.alert(
          'No Routes Available',
          `No routes are configured from ${station.name} yet. Please try another station.`,
          [
            {
              text: 'Choose Different Station', onPress: () => {
                setStep('stations');
                setSelectedStation(null);
                setDestinations([]);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
      Alert.alert('Error', 'Failed to load destinations for this station');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search filter
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredStations(stations);
      return;
    }

    const filtered = stations.filter(station =>
      station.name.toLowerCase().includes(searchText.toLowerCase()) ||
      station.city.toLowerCase().includes(searchText.toLowerCase()) ||
      station.state.toLowerCase().includes(searchText.toLowerCase())
    );

    setFilteredStations(filtered);
  }, [searchText, stations]);

  // Initial load
  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  // Navigate to trips screen
  const selectDestination = useCallback((destination: Destination) => {
    if (!selectedStation) return;

    router.push({
      pathname: '/(passenger)/search/trips',
      params: {
        stationId: selectedStation.id,
        stationName: selectedStation.name,
        destinationId: destination.id,
        destinationName: destination.endStation?.name || destination.description,
      }
    });
  }, [selectedStation, router]);

  // Render station item
  const renderStationItem = ({ item }: { item: Station }) => (
    <TouchableOpacity
      style={styles.destinationCard}
      onPress={() => fetchDestinations(item)}
    >
      <View style={styles.stationHeader}>
        <MaterialIcons name="location-on" size={24} color={theme.colors.primary} />
        <View style={styles.stationInfo}>
          <Text style={styles.destinationName}>{item.name}</Text>
          <Text style={styles.destinationDetails}>
            {item.city}, {item.state}
          </Text>
          {item.amenities && Object.keys(item.amenities).length > 0 && (
            <View style={styles.amenitiesRow}>
              <MaterialIcons name="star" size={14} color={theme.colors.warning} />
              <Text style={styles.amenitiesText}>Amenities available</Text>
            </View>
          )}
        </View>
        <MaterialIcons name="arrow-forward-ios" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  // Render destination item
  const renderDestinationItem = ({ item }: { item: Destination }) => (
    <TouchableOpacity
      style={styles.destinationCard}
      onPress={() => selectDestination(item)}
    >
      <View style={styles.routeInfo}>
        <MaterialIcons name="route" size={24} color={theme.colors.secondary} />
        <View style={styles.routeDetails}>
          <Text style={styles.destinationName}>
            To: {item.endStation?.name || 'Unknown Destination'}
          </Text>
          <Text style={styles.destinationDetails}>
            {item.endStation?.city}, {item.endStation?.state}
          </Text>
          <View style={styles.destinationMeta}>
            <Text style={styles.price}>From ${item.basePrice}</Text>
            <Text style={styles.duration}>{item.estimatedDuration} min</Text>
            <Text style={styles.distance}>{item.distance} km</Text>
          </View>
        </View>
        <MaterialIcons name="arrow-forward-ios" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => {
          if (step === 'destinations') {
            setStep('stations');
            setSelectedStation(null);
            setDestinations([]);
          } else {
            router.back();
          }
        }} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {step === 'stations' ? 'Choose Departure Station' : 'Choose Destination'}
        </Text>

        <View style={styles.headerAction} />
      </View>

      {step === 'destinations' && selectedStation && (
        <View style={styles.selectedStationBanner}>
          <MaterialIcons name="location-on" size={20} color="#ffffff" />
          <Text style={styles.selectedStationText}>
            From: {selectedStation.name}
          </Text>
          <TouchableOpacity onPress={() => {
            setStep('stations');
            setSelectedStation(null);
            setDestinations([]);
          }}>
            <Text style={styles.changeStationText}>Change</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'stations' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stations by name or city..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#999"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <MaterialIcons name="clear" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );

  if (loading && (step === 'stations' ? stations.length === 0 : destinations.length === 0)) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            {step === 'stations' ? 'Loading stations...' : 'Loading destinations...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      {step === 'stations' ? (
        <FlatList
          data={filteredStations}
          keyExtractor={(item) => item.id}
          renderItem={renderStationItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchStations(true)}
              colors={[theme.colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="location-off" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchText ? 'No stations found' : 'No stations available'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchText
                  ? `No stations match "${searchText}". Try a different search.`
                  : 'No departure stations are configured yet.'
                }
              </Text>
              {searchText && (
                <TouchableOpacity
                  style={styles.refreshEmptyButton}
                  onPress={() => setSearchText('')}
                >
                  <Text style={styles.refreshEmptyButtonText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          ListHeaderComponent={
            filteredStations.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {searchText
                    ? `${filteredStations.length} station${filteredStations.length !== 1 ? 's' : ''} found`
                    : `${filteredStations.length} departure station${filteredStations.length !== 1 ? 's' : ''} available`
                  }
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={destinations}
          keyExtractor={(item) => item.id}
          renderItem={renderDestinationItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="route" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No routes available</Text>
              <Text style={styles.emptySubtext}>
                No routes are configured from {selectedStation?.name} yet.
              </Text>
              <TouchableOpacity
                style={styles.refreshEmptyButton}
                onPress={() => {
                  setStep('stations');
                  setSelectedStation(null);
                  setDestinations([]);
                }}
              >
                <Text style={styles.refreshEmptyButtonText}>Choose Different Station</Text>
              </TouchableOpacity>
            </View>
          }
          ListHeaderComponent={
            destinations.length > 0 ? (
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderText}>
                  {destinations.length} destination{destinations.length !== 1 ? 's' : ''} available from {selectedStation?.name}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

// Enhanced styles for the search screen
const styles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  // Header styles
  header: {
    backgroundColor: theme.colors.primary,
    paddingBottom: 20,
  },

  headerTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },

  backButton: {
    padding: 8,
    marginRight: 8,
  },

  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#ffffff',
    textAlign: 'center' as const,
  },

  headerAction: {
    width: 40,
  },

  selectedStationBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },

  selectedStationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
    marginLeft: 8,
  },

  changeStationText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#ffffff',
    textDecorationLine: 'underline' as const,
  },

  // Search container
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  searchInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#ffffff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    marginRight: 8,
  },

  // Loading and centered content
  centered: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 40,
  },

  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
    textAlign: 'center' as const,
  },

  // List styles
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  listHeader: {
    marginBottom: 16,
  },

  listHeaderText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: theme.colors.text.secondary,
    textAlign: 'center' as const,
  },

  // Station/Destination card styles
  destinationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  stationHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  stationInfo: {
    flex: 1,
    marginLeft: 12,
  },

  destinationName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },

  destinationDetails: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },

  amenitiesRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  amenitiesText: {
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '500' as const,
    marginLeft: 4,
  },

  routeInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  routeDetails: {
    flex: 1,
    marginLeft: 12,
  },

  destinationMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 16,
  },

  price: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: theme.colors.primary,
  },

  duration: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },

  distance: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
  },

  // Empty state
  emptyState: {
    alignItems: 'center' as const,
    padding: 40,
    paddingTop: 80,
  },

  emptyText: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: theme.colors.text.secondary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center' as const,
  },

  emptySubtext: {
    fontSize: 16,
    color: theme.colors.text.tertiary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },

  refreshEmptyButton: {
    backgroundColor: theme.colors.button.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  refreshEmptyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
};