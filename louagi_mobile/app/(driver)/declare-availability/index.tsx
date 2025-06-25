import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getStations, getDestinations, declareAvailability } from '../../../src/services/api';

export default function DeclareAvailabilityScreen() {
  const router = useRouter();

  const [stations, setStations] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [submitting, setSubmitting] = useState(false);

// Load stations on mount
useEffect(() => {
  setLoadingStations(true);
  getStations({ limit: 50 }).then(res => {
    console.log("Stations API response:", res);
    if (res.success && Array.isArray(res.stations)) {
      setStations(res.stations);
      if (res.stations.length === 0) {
        Alert.alert('No stations found in the database');
      }
    } else {
      Alert.alert('Failed to load stations');
    }
    setLoadingStations(false);
  }).catch(err => {
    setLoadingStations(false);
    Alert.alert('Network or API error loading stations');
  });
}, []);

  // Load destinations when station is selected
  useEffect(() => {
    if (selectedStation) {
      setLoadingDestinations(true);
      getDestinations(selectedStation.id, { limit: 50 }).then(res => {
        console.log("Destinations API response:", res);
        if (res.success && res.data && Array.isArray(res.data.destinations)) {
          setDestinations(res.data.destinations);
        } else {
          setDestinations([]);
          Alert.alert('No destinations for this station');
        }
        setLoadingDestinations(false);
      }).catch(err => {
        setLoadingDestinations(false);
        Alert.alert('Network or API error loading destinations');
      });
    } else {
      setDestinations([]);
      setSelectedDestination(null);
    }
  }, [selectedStation]);

  // For now, use a mock scheduleId until you add schedule selection!
  const mockScheduleId = 'schedule-1';

  const handleSubmit = async () => {
    if (!selectedStation || !selectedDestination) {
      Alert.alert('Please select a station and a destination');
      return;
    }
    setSubmitting(true);
    try {
      const response = await declareAvailability({
        stationId: selectedStation.id,
        scheduleId: mockScheduleId,
        destinationId: selectedDestination.id,
      });
      if (response.success) {
        Alert.alert('Success', 'Availability declared!');
        router.back();
      } else {
        Alert.alert('Error', response.message || 'Could not declare availability');
      }
    } catch (err) {
      Alert.alert('Error', 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // ------- DEBUG LOG -------
  console.log('STATIONS ARRAY:', stations);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Declare Availability</Text>
      {/* Station Selection */}
      <Text style={{ fontWeight: '600', marginBottom: 6 }}>Select Station:</Text>
      {loadingStations ? (
        <ActivityIndicator size="small" />
      ) : (
        <FlatList
          data={stations}
          horizontal
          keyExtractor={item => item.id?.toString() || item.station_id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                padding: 12,
                margin: 4,
                borderRadius: 8,
                backgroundColor: selectedStation?.id === item.id ? '#007bff' : '#eee'
              }}
              onPress={() => setSelectedStation(item)}
            >
              <Text style={{ color: selectedStation?.id === item.id ? 'white' : '#333' }}>
                {item.name || item.station_name || item.label || JSON.stringify(item)}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={{ color: 'gray', fontStyle: 'italic', marginTop: 10 }}>No stations found.</Text>
          }
        />
      )}
      {/* Destination Selection */}
      {selectedStation && (
        <>
          <Text style={{ fontWeight: '600', marginVertical: 12 }}>Select Destination:</Text>
          {loadingDestinations ? (
            <ActivityIndicator size="small" />
          ) : (
            <FlatList
              data={destinations}
              horizontal
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    padding: 12,
                    margin: 4,
                    borderRadius: 8,
                    backgroundColor: selectedDestination?.id === item.id ? '#007bff' : '#eee'
                  }}
                  onPress={() => setSelectedDestination(item)}
                >
                  <Text style={{ color: selectedDestination?.id === item.id ? 'white' : '#333' }}>
                    {item.endStation?.name || item.description || item.name || JSON.stringify(item)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={{ color: 'gray', fontStyle: 'italic', marginTop: 10 }}>No destinations found.</Text>
              }
            />
          )}
        </>
      )}
      {/* Confirm Button */}
      {selectedStation && selectedDestination && (
        <TouchableOpacity
          style={{
            marginTop: 30,
            padding: 16,
            backgroundColor: submitting ? '#aaa' : '#007bff',
            borderRadius: 10,
            alignItems: 'center'
          }}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            {submitting ? 'Submitting...' : 'Confirm and Declare Availability'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
