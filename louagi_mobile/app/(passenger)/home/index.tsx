// app/(passenger)/home/index.tsx - FIXED import paths
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  Alert,
  RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { getStations, type Station } from '../../../src/services/api';

export default function PassengerHomeScreen() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch stations
  const fetchStations = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await getStations({ limit: 50 });
      
      if (response.success && response.data) {
        setStations(response.data.stations);
      } else {
        setError('Failed to load stations');
      }
    } catch (err: any) {
      console.error('Error fetching stations:', err);
      setError('Failed to load stations. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // Navigate to search screen - FIXED PATH
  const handleStationSelect = (station: Station) => {
    router.push({
      pathname: '/(passenger)/search',
      params: { 
        stationId: station.id, 
        stationName: station.name 
      }
    });
  };

  // Render station item
  const renderStationItem = ({ item }: { item: Station }) => (
    <TouchableOpacity
      style={styles.stationCard}
      onPress={() => handleStationSelect(item)}
    >
      <Text style={styles.stationName}>{item.name}</Text>
      <Text style={styles.stationLocation}>{item.city}, {item.state}</Text>
      <Text style={styles.stationAddress}>{item.address}</Text>
      
      {item.amenities && Object.keys(item.amenities).length > 0 && (
        <View style={styles.amenitiesContainer}>
          <Text style={styles.amenitiesText}>Amenities available</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // Loading state
  if (loading && stations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading stations...</Text>
      </View>
    );
  }

  // Error state
  if (error && stations.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchStations()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Trip</Text>
        <Text style={styles.subtitle}>Select your departure station</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stations.length}</Text>
          <Text style={styles.statLabel}>Stations</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>🚗</Text>
          <Text style={styles.statLabel}>Available Now</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>⚡</Text>
          <Text style={styles.statLabel}>Instant Booking</Text>
        </View>
      </View>

      {/* Stations List */}
      <FlatList
        data={stations}
        keyExtractor={(item) => item.id}
        renderItem={renderStationItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStations(true)}
            colors={['#0066cc']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No stations available</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => fetchStations()}
            >
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
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
    padding: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  stationCard: {
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
  stationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stationLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  stationAddress: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  amenitiesContainer: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  amenitiesText: {
    fontSize: 10,
    color: '#0066cc',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
});