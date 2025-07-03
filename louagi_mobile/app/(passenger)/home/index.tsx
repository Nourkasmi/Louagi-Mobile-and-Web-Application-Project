// 📁 app/(passenger)/home/index.tsx - UPDATED (Clean Logic Only)
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { logout } from '../../../src/store/authSlice';
import { getStations, type Station } from '../../../src/services/api';
import { styles } from './index.styles'; // 🆕 Import styles

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

  if (loading && stations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading stations...</Text>
      </View>
    );
  }

  if (error && stations.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>🚌</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchStations()}>
          <Text style={styles.retryButtonText}>🔄 Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Book Your Louage</Text>
          <Text style={styles.subtitle}>Select your departure station</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
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
    </View>
  );
}