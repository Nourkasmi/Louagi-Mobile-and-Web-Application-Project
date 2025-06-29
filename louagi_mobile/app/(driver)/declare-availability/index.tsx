// app/(driver)/declare-availability/index.tsx - COMPLETE FIXED VERSION
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  StyleSheet,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  getStations, 
  getDestinations, 
  getSchedules,
  declareAvailability,
  type Station,
  type Destination,
  type Schedule
} from '../../../src/services/api';

export default function DeclareAvailabilityScreen() {
  const router = useRouter();

  const [stations, setStations] = useState<Station[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [loadingStations, setLoadingStations] = useState(false);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load stations on mount
  useEffect(() => {
    const loadStations = async () => {
      setLoadingStations(true);
      try {
        const res = await getStations({ limit: 50 });
        if (res.success && res.data?.stations) {
          setStations(res.data.stations);
        } else if (res.success && res.stations) {
          setStations(res.stations);
        } else {
          Alert.alert('Error', 'Failed to load stations');
        }
      } catch (error) {
        console.error('Error loading stations:', error);
        Alert.alert('Error', 'Failed to load stations');
      } finally {
        setLoadingStations(false);
      }
    };

    loadStations();
  }, []);

  // Load destinations when station is selected
  useEffect(() => {
    if (!selectedStation) {
      setDestinations([]);
      setSelectedDestination(null);
      return;
    }

    const loadDestinations = async () => {
      setLoadingDestinations(true);
      try {
        const res = await getDestinations(selectedStation.id, { limit: 50 });
        const destinationsArr = res.data?.destinations || res.destinations || [];
        if (res.success && Array.isArray(destinationsArr)) {
          setDestinations(destinationsArr);
        } else {
          setDestinations([]);
          Alert.alert('Info', 'No destinations available for this station');
        }
      } catch (error) {
        console.error('Error loading destinations:', error);
        Alert.alert('Error', 'Failed to load destinations');
      } finally {
        setLoadingDestinations(false);
      }
    };

    loadDestinations();
  }, [selectedStation]);

  // Load schedules when station is selected
  useEffect(() => {
    if (!selectedStation) {
      setSchedules([]);
      setSelectedSchedule(null);
      return;
    }

    const loadSchedules = async () => {
      setLoadingSchedules(true);
      try {
        const res = await getSchedules(selectedStation.id);
        const schedulesArr = res.data?.schedules || res.schedules || [];
        setSchedules(schedulesArr);
      } catch (error) {
        console.error('Error loading schedules:', error);
        Alert.alert('Error', 'Failed to load schedules');
      } finally {
        setLoadingSchedules(false);
      }
    };

    loadSchedules();
  }, [selectedStation]);

  // Handle station selection
  const handleStationSelect = (station: Station) => {
    setSelectedStation(station);
    setSelectedDestination(null);
    setSelectedSchedule(null);
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!selectedStation || !selectedDestination || !selectedSchedule) {
      Alert.alert('Error', 'Please select a station, destination, and schedule');
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
        Alert.alert('Success', 'Availability declared successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Could not declare availability');
      }
    } catch (error) {
      console.error('Error declaring availability:', error);
      Alert.alert('Error', 'An error occurred while declaring availability');
    } finally {
      setSubmitting(false);
    }
  };

  // Render station item
  const renderStationItem = ({ item }: { item: Station }) => (
    <TouchableOpacity
      style={[
        styles.selectionItem,
        selectedStation?.id === item.id && styles.selectedItem
      ]}
      onPress={() => handleStationSelect(item)}
    >
      <Text style={styles.selectionItemTitle}>{item.name}</Text>
      <Text style={styles.selectionItemSubtitle}>
        {item.city}, {item.state}
      </Text>
    </TouchableOpacity>
  );

  // Render destination item
  const renderDestinationItem = ({ item }: { item: Destination }) => (
    <TouchableOpacity
      style={[
        styles.selectionItem,
        selectedDestination?.id === item.id && styles.selectedItem
      ]}
      onPress={() => setSelectedDestination(item)}
    >
      <Text style={styles.selectionItemTitle}>
        {item.endStation?.name || item.description}
      </Text>
      <Text style={styles.selectionItemSubtitle}>
        ${item.basePrice} • {item.estimatedDuration} min
      </Text>
    </TouchableOpacity>
  );

  // Render schedule item
  const renderScheduleItem = ({ item }: { item: Schedule }) => (
    <TouchableOpacity
      style={[
        styles.selectionItem,
        selectedSchedule?.id === item.id && styles.selectedItem
      ]}
      onPress={() => setSelectedSchedule(item)}
    >
      <Text style={styles.selectionItemTitle}>
        {item.dayOfWeek}
      </Text>
      <Text style={styles.selectionItemSubtitle}>
        {item.startTime} - {item.endTime}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Declare Availability</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Station Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Station:</Text>
          {loadingStations ? (
            <ActivityIndicator size="small" color="#007bff" style={styles.loader} />
          ) : (
            <FlatList
              data={stations}
              horizontal
              keyExtractor={item => item.id}
              renderItem={renderStationItem}
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalList}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No stations available</Text>
              }
            />
          )}
        </View>

        {/* Destination Selection */}
        {selectedStation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Destination:</Text>
            {loadingDestinations ? (
              <ActivityIndicator size="small" color="#007bff" style={styles.loader} />
            ) : (
              <FlatList
                data={destinations}
                horizontal
                keyExtractor={item => item.id}
                renderItem={renderDestinationItem}
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalList}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No destinations available</Text>
                }
              />
            )}
          </View>
        )}

        {/* Schedule Selection */}
        {selectedStation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Schedule:</Text>
            {loadingSchedules ? (
              <ActivityIndicator size="small" color="#007bff" style={styles.loader} />
            ) : schedules.length === 0 ? (
              <Text style={styles.emptyText}>No schedules available for this station</Text>
            ) : (
              <FlatList
                data={schedules}
                horizontal
                keyExtractor={item => item.id}
                renderItem={renderScheduleItem}
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalList}
              />
            )}
          </View>
        )}

        {/* Confirm Button */}
        {selectedStation && selectedDestination && selectedSchedule && (
          <View style={styles.confirmSection}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Trip Summary:</Text>
              <Text style={styles.summaryText}>
                📍 {selectedStation.name} → {selectedDestination.endStation?.name || selectedDestination.description}
              </Text>
              <Text style={styles.summaryText}>
                📅 {selectedSchedule.dayOfWeek} ({selectedSchedule.startTime} - {selectedSchedule.endTime})
              </Text>
              <Text style={styles.summaryText}>
                💰 Base Price: ${selectedDestination.basePrice}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Declare Availability
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  loader: {
    marginVertical: 20,
  },
  horizontalList: {
    marginVertical: 8,
  },
  selectionItem: {
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e9ecef',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedItem: {
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff',
  },
  selectionItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectionItemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  confirmSection: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  confirmButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});