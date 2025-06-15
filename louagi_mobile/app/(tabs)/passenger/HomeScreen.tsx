import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getStations, Station } from '../../../src/services/api';
import Config from '../../../src/config';

export default function HomeScreen() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // ✅ ADDED: Debug function
  const testConnection = async () => {
    try {
      console.log('🧪 Testing connection to:', Config.API_BASE_URL);
      
      // Test basic fetch first
      const response = await fetch(`${Config.API_BASE_URL}/stations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
      
      console.log('🧪 Response status:', response.status);
      console.log('🧪 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log('🧪 Raw response:', text.substring(0, 200) + '...');
      
      try {
        const data = JSON.parse(text);
        console.log('🧪 Parsed JSON:', data);
        
        Alert.alert(
          'Connection Test Result', 
          `Status: ${response.status}\nStations: ${data.stations?.length || 0}\nSuccess: ${data.success}`,
          [{ text: 'OK' }]
        );
      } catch (parseError) {
        console.error('🧪 JSON Parse Error:', parseError);
        Alert.alert('Connection Test', `Got response but not JSON.\nStatus: ${response.status}\nContent: ${text.substring(0, 100)}...`);
      }
      
    } catch (error: any) {
      console.error('🧪 Connection test failed:', error);
      Alert.alert('Connection Failed', error.message || 'Unknown error');
    }
  };

  const fetchStations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📱 Fetching stations...');
      const data = await getStations();
      
      console.log('📱 Received stations data:', data);
      
      if (data.success && data.stations) {
        setStations(data.stations);
        console.log('📱 Set stations:', data.stations.length);
      } else {
        setError('No stations available');
      }
    } catch (err: any) {
      console.error('📱 Error fetching stations:', err);
      setError('Failed to load stations. Please check your connection.');
      
      Alert.alert(
        'Connection Error', 
        'Could not load stations. Please check your internet connection and try again.',
        [
          { text: 'Test Connection', onPress: testConnection },
          { text: 'Retry', onPress: fetchStations },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading stations...</Text>
        <Text style={styles.debugText}>API: {Config.API_BASE_URL}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.debugText}>API: {Config.API_BASE_URL}</Text>
        <TouchableOpacity style={styles.button} onPress={testConnection}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={fetchStations}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stations.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No stations available</Text>
        <Text style={styles.debugText}>API: {Config.API_BASE_URL}</Text>
        <TouchableOpacity style={styles.button} onPress={testConnection}>
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select a Station</Text>
      <Text style={styles.debugText}>Found {stations.length} stations</Text>
      
      {/* ✅ TEMPORARY: Debug button */}
      <TouchableOpacity style={styles.debugButton} onPress={testConnection}>
        <Text style={styles.debugButtonText}>🧪 Test API</Text>
      </TouchableOpacity>
      
      <FlatList
        data={stations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.stationCard}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/passenger/SearchScreen',
                params: { stationId: item.id, stationName: item.name }
              })
            }
          >
            <Text style={styles.stationName}>{item.name}</Text>
            <Text style={styles.stationLocation}>{item.city}, {item.state}</Text>
            <Text style={styles.stationAddress}>{item.address}</Text>
          </TouchableOpacity>
        )}
        refreshing={loading}
        onRefresh={fetchStations}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  stationCard: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginVertical: 8,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 10,
    alignSelf: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});