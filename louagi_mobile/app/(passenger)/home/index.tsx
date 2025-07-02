// app/(passenger)/home/index.tsx - FIXED: Always show logout button
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet, 
  RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { logout } from '../../../src/store/authSlice';
import { getStations, type Station } from '../../../src/services/api';

export default function PassengerHomeScreen() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dispatch = useDispatch();

  // Fetch stations
  const fetchStations = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);
      const response = await getStations({ limit: 50 });

      if (response.success) {
        const stationsData = response.data?.stations || response.stations || [];
        setStations(stationsData);

        if (stationsData.length === 0) setError('No stations available at the moment');
      } else {
        setError('Failed to load stations');
      }
    } catch (err: any) {
      setError('Failed to load stations. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // Navigate to search screen
  const handleStationSelect = (station: Station) => {
    router.push({
      pathname: '/(passenger)/search',
      params: { 
        stationId: station.id, 
        stationName: station.name 
      }
    });
  };

  // CLEAN LOGOUT
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('louagi_token');
      global.authToken = undefined;
      dispatch(logout());
      router.replace('/login');
    } catch (error) {
      dispatch(logout());
      router.replace('/login');
    }
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
          <Text style={styles.amenitiesText}>✨ Amenities available</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // 🔧 FIXED: Always render the full structure including header with logout button
  return (
    <View style={styles.container}>
      {/* Header - ALWAYS SHOWN */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Book Your Louage</Text>
          <Text style={styles.subtitle}>Select your departure station</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats - ALWAYS SHOWN */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stations.length}</Text>
          <Text style={styles.statLabel}>Available Stations</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>🚐</Text>
          <Text style={styles.statLabel}>Quick & Easy</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>⚡</Text>
          <Text style={styles.statLabel}>Real-time</Text>
        </View>
      </View>

      {/* Content Area - Show loading, error, or stations list */}
      {loading && stations.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading stations...</Text>
        </View>
      ) : error && stations.length === 0 ? (
        // 🔧 FIXED: Error state no longer replaces entire component
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>🚌</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchStations()}>
            <Text style={styles.retryButtonText}>🔄 Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Welcome Message */}
          {stations.length > 0 && (
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeText}>
                👋 Welcome! Choose your departure station to find available trips.
              </Text>
            </View>
          )}

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
                <Text style={styles.emptyIcon}>🚌</Text>
                <Text style={styles.emptyText}>No stations available</Text>
                <Text style={styles.emptySubtext}>
                  Pull to refresh or try again later
                </Text>
                <TouchableOpacity 
                  style={styles.retryButton} 
                  onPress={() => fetchStations()}
                >
                  <Text style={styles.retryButtonText}>🔄 Refresh</Text>
                </TouchableOpacity>
              </View>
            }
          />
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flex: 1,
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
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
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
  welcomeCard: {
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  welcomeText: {
    fontSize: 14,
    color: '#0d47a1',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
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
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  amenitiesText: {
    fontSize: 10,
    color: '#2e7d32',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
});