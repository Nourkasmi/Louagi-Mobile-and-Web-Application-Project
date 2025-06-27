import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  getStations, 
  getDestinations, 
  getSchedules,
  declareAvailability 
} from '../../../src/services/api';

export default function DeclareAvailabilityScreen() {
  const router = useRouter();

  const [stations, setStations] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load stations on mount
  useEffect(() => {
    setLoadingStations(true);
    getStations({ limit: 50 }).then(res => {
      console.log("Stations API response:", res);
      if (res.success && Array.isArray(res.stations)) {
        setStations(res.stations.map(s => ({ ...s, id: s.id || s.station_id })));
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
        const destinationsArr = res.destinations || (res.data && res.data.destinations) || [];
        if (res.success && Array.isArray(destinationsArr)) {
          setDestinations(destinationsArr);
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

  // Load schedules when station is selected
  useEffect(() => {
    if (selectedStation) {
      console.log("DEBUG - Calling getSchedules with:", selectedStation.id);
      setLoadingSchedules(true);
      (async () => {
        try {
          const res = await getSchedules(selectedStation.id);
          console.log('=== RAW SCHEDULES RESPONSE:', JSON.stringify(res, null, 2));
          if (!res || typeof res !== 'object') {
            throw new Error('No response or invalid response type');
          }
          const schedulesArr =
            (Array.isArray(res.schedules) && res.schedules) ||
            (res.data && Array.isArray(res.data.schedules) && res.data.schedules) ||
            [];
          console.log('=== SCHEDULES ARRAY TO USE:', schedulesArr);
          setSchedules(schedulesArr);
        } catch (err) {
          console.error('Error in getSchedules useEffect:', err);
          setSchedules([]);
          Alert.alert('Error loading schedules', err.message || 'Unknown error');
        } finally {
          setLoadingSchedules(false);
        }
      })();
    } else {
      setSchedules([]);
      setSelectedSchedule(null);
    }
  }, [selectedStation]);

  const handleSubmit = async () => {
    if (!selectedStation || !selectedDestination || !selectedSchedule) {
      Alert.alert('Please select a station, destination, and schedule');
      return;
    }
    setSubmitting(true);
    try {
      const response = await declareAvailability({
        stationId: selectedStation.id,
        scheduleId: selectedSchedule.id,
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
              onPress={() => {
                setSelectedStation({ ...item, id: item.id || item.station_id });
                setSelectedDestination(null);
                setSelectedSchedule(null);
              }}
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

      {/* Schedule Selection */}
      {selectedStation && (
        <>
          <Text style={{ fontWeight: '600', marginVertical: 12 }}>Select Schedule:</Text>
          {loadingSchedules ? (
            <ActivityIndicator size="small" />
          ) : schedules.length === 0 ? (
            <Text style={{ color: 'red', fontStyle: 'italic', marginTop: 10 }}>
              No schedules available for this station.
            </Text>
          ) : (
            <FlatList
              data={schedules}
              horizontal
              keyExtractor={item => item.id?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    padding: 12,
                    margin: 4,
                    borderRadius: 8,
                    backgroundColor: selectedSchedule?.id === item.id ? '#007bff' : '#eee'
                  }}
                  onPress={() => setSelectedSchedule(item)}
                >
                  <Text style={{ color: selectedSchedule?.id === item.id ? 'white' : '#333' }}>
                    {item.dayOfWeek} {item.startTime}-{item.endTime}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {/* Confirm Button */}
      {selectedStation && selectedDestination && selectedSchedule && (
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
