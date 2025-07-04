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
        console.log('🏢 Stations response:', res);

        // Handle different response structures
        let stationsData: Station[] = [];
        if (res.success && res.data?.stations) {
          stationsData = res.data.stations;
        } else if (res.success && Array.isArray(res.stations)) {
          stationsData = res.stations;
        } else if (Array.isArray(res.data)) {
          stationsData = res.data;
        }

        setStations(stationsData);

        if (stationsData.length === 0) {
          Alert.alert('Info', 'No stations available at the moment');
        }
      } catch (error) {
        console.error('❌ Error loading stations:', error);
        Alert.alert('Error', 'Failed to load stations. Please check your connection.');
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
        console.log('🎯 Loading destinations for station:', selectedStation.id);
        const res = await getDestinations(selectedStation.id, { limit: 50 });
        console.log('🎯 Destinations response:', res);

        // Handle different response structures
        let destinationsData: Destination[] = [];
        if (res.success && res.data?.destinations) {
          destinationsData = res.data.destinations;
        } else if (res.success && Array.isArray(res.destinations)) {
          destinationsData = res.destinations;
        } else if (Array.isArray(res.data)) {
          destinationsData = res.data;
        }

        setDestinations(destinationsData);

        if (destinationsData.length === 0) {
          Alert.alert('Info', 'No destinations available for this station');
        }
      } catch (error) {
        console.error('❌ Error loading destinations:', error);
        Alert.alert('Error', 'Failed to load destinations for this station');
        setDestinations([]);
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
        console.log('📅 Loading schedules for station:', selectedStation.id);
        const res = await getSchedules(selectedStation.id);
        console.log('📅 Schedules response:', res);

        // Handle different response structures
        let schedulesData: Schedule[] = [];
        if (res.success && res.data?.schedules) {
          schedulesData = res.data.schedules;
        } else if (res.success && Array.isArray(res.schedules)) {
          schedulesData = res.schedules;
        } else if (Array.isArray(res.data)) {
          schedulesData = res.data;
        }

        // Filter for today's schedules
        const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
        const todaySchedules = schedulesData.filter(schedule =>
          schedule.dayOfWeek === today && schedule.isActive
        );

        setSchedules(todaySchedules);

        if (todaySchedules.length === 0) {
          Alert.alert('Info', 'No active schedules available for today at this station');
        }
      } catch (error) {
        console.error('❌ Error loading schedules:', error);
        Alert.alert('Error', 'Failed to load schedules for this station');
        setSchedules([]);
      } finally {
        setLoadingSchedules(false);
      }
    };

    loadSchedules();
  }, [selectedStation]);

  // Handle station selection
  const handleStationSelect = (station: Station) => {
    console.log('🏢 Station selected:', station.name);
    setSelectedStation(station);
    setSelectedDestination(null);
    setSelectedSchedule(null);
  };

  // Handle destination selection
  const handleDestinationSelect = (destination: Destination) => {
    console.log('🎯 Destination selected:', destination.description);
    setSelectedDestination(destination);
  };

  // Handle schedule selection
  const handleScheduleSelect = (schedule: Schedule) => {
    console.log('📅 Schedule selected:', schedule.startTime, '-', schedule.endTime);
    setSelectedSchedule(schedule);
  };

  // Handle submission with better error handling
  const handleSubmit = async () => {
    if (!selectedStation || !selectedDestination || !selectedSchedule) {
      Alert.alert('Missing Selection', 'Please select a station, destination, and schedule before continuing.');
      return;
    }

    console.log('🚀 Declaring availability with:');
    console.log('Station:', selectedStation.name, '(ID:', selectedStation.id + ')');
    console.log('Destination:', selectedDestination.description, '(ID:', selectedDestination.id + ')');
    console.log('Schedule:', selectedSchedule.startTime, '-', selectedSchedule.endTime, '(ID:', selectedSchedule.id + ')');

    setSubmitting(true);

    try {
      const response = await declareAvailability({
        stationId: selectedStation.id,
        scheduleId: selectedSchedule.id,
        destinationId: selectedDestination.id,
      });

      console.log('✅ Declare availability response:', response);

      // Check for success regardless of response structure
      const isSuccess = response.success || response.data?.success ||
        response.trip || response.data?.trip;

      if (isSuccess) {
        const tripData = response.data?.trip || response.trip;
        const message = response.message || response.data?.message || 'Availability declared successfully!';

        // Show success with trip details
        let successMessage = message;
        if (tripData) {
          successMessage += `\n\nTrip created for ${selectedDestination.description}`;
          if (tripData.departureTime) {
            const departureTime = new Date(tripData.departureTime).toLocaleTimeString();
            successMessage += `\nScheduled departure: ${departureTime}`;
          }
          if (response.data?.timing?.queuePosition) {
            successMessage += `\nQueue position: ${response.data.timing.queuePosition}`;
          }
        }

        Alert.alert(
          'Success! 🎉',
          successMessage,
          [
            {
              text: 'View Dashboard',
              onPress: () => router.replace('/(driver)/dashboard')
            },
            {
              text: 'Declare Another',
              style: 'cancel',
              onPress: () => {
                // Reset selections for another declaration
                setSelectedStation(null);
                setSelectedDestination(null);
                setSelectedSchedule(null);
              }
            }
          ]
        );
      } else {
        // Handle API errors with specific messages
        const errorMessage = response.message ||
          response.data?.message ||
          response.error?.message ||
          'Could not declare availability. Please try again.';

        console.error('❌ API Error:', errorMessage);
        Alert.alert('Unable to Declare Availability', errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Network/API Error:', error);

      // More specific error handling
      let errorMessage = 'Failed to declare availability. ';

      if (error.response?.status === 400) {
        const apiError = error.response?.data?.message || 'Invalid request data';
        errorMessage += apiError;
      } else if (error.response?.status === 401) {
        errorMessage += 'Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage += 'You don\'t have permission to perform this action.';
      } else if (error.response?.status >= 500) {
        errorMessage += 'Server error. Please try again in a moment.';
      } else if (!error.response) {
        errorMessage += 'Please check your internet connection.';
      } else {
        errorMessage += 'Please try again.';
      }

      Alert.alert('Connection Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Get day name for schedule display
  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
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
      <Text style={[
        styles.selectionItemTitle,
        selectedStation?.id === item.id && styles.selectedItemTitle
      ]}>
        {item.name}
      </Text>
      <Text style={[
        styles.selectionItemSubtitle,
        selectedStation?.id === item.id && styles.selectedItemSubtitle
      ]}>
        📍 {item.city}, {item.state}
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
      onPress={() => handleDestinationSelect(item)}
    >
      <Text style={[
        styles.selectionItemTitle,
        selectedDestination?.id === item.id && styles.selectedItemTitle
      ]}>
        🎯 {item.endStation?.name || item.description}
      </Text>
      <Text style={[
        styles.selectionItemSubtitle,
        selectedDestination?.id === item.id && styles.selectedItemSubtitle
      ]}>
        💰 ${item.basePrice} • ⏱️ {item.estimatedDuration} min
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
      onPress={() => handleScheduleSelect(item)}
    >
      <Text style={[
        styles.selectionItemTitle,
        selectedSchedule?.id === item.id && styles.selectedItemTitle
      ]}>
        📅 {getDayName(item.dayOfWeek)}
      </Text>
      <Text style={[
        styles.selectionItemSubtitle,
        selectedSchedule?.id === item.id && styles.selectedItemSubtitle
      ]}>
        🕐 {item.startTime} - {item.endTime}
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
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, selectedStation && styles.progressDotActive]}>
              <Text style={styles.progressNumber}>1</Text>
            </View>
            <Text style={styles.progressLabel}>Station</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, selectedDestination && styles.progressDotActive]}>
              <Text style={styles.progressNumber}>2</Text>
            </View>
            <Text style={styles.progressLabel}>Destination</Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={[styles.progressDot, selectedSchedule && styles.progressDotActive]}>
              <Text style={styles.progressNumber}>3</Text>
            </View>
            <Text style={styles.progressLabel}>Schedule</Text>
          </View>
        </View>

        {/* Station Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Select Station 🏢</Text>
          <Text style={styles.sectionDescription}>Choose the station where you want to pick up passengers</Text>

          {loadingStations ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={styles.loadingText}>Loading stations...</Text>
            </View>
          ) : stations.length === 0 ? (
            <Text style={styles.emptyText}>No stations available</Text>
          ) : (
            <FlatList
              data={stations}
              horizontal
              keyExtractor={item => item.id}
              renderItem={renderStationItem}
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalList}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        {/* Destination Selection */}
        {selectedStation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Select Destination 🎯</Text>
            <Text style={styles.sectionDescription}>
              Choose where you want to take passengers from {selectedStation.name}
            </Text>

            {loadingDestinations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007bff" />
                <Text style={styles.loadingText}>Loading destinations...</Text>
              </View>
            ) : destinations.length === 0 ? (
              <Text style={styles.emptyText}>No destinations available for this station</Text>
            ) : (
              <FlatList
                data={destinations}
                horizontal
                keyExtractor={item => item.id}
                renderItem={renderDestinationItem}
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalList}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        )}

        {/* Schedule Selection */}
        {selectedStation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Select Schedule 📅</Text>
            <Text style={styles.sectionDescription}>
              Choose your working hours for today
            </Text>

            {loadingSchedules ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007bff" />
                <Text style={styles.loadingText}>Loading schedules...</Text>
              </View>
            ) : schedules.length === 0 ? (
              <Text style={styles.emptyText}>No active schedules available for today</Text>
            ) : (
              <FlatList
                data={schedules}
                horizontal
                keyExtractor={item => item.id}
                renderItem={renderScheduleItem}
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalList}
                contentContainerStyle={styles.listContent}
              />
            )}
          </View>
        )}

        {/* Confirm Button */}
        {selectedStation && selectedDestination && selectedSchedule && (
          <View style={styles.confirmSection}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📋 Trip Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>From:</Text>
                <Text style={styles.summaryValue}>{selectedStation.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>To:</Text>
                <Text style={styles.summaryValue}>
                  {selectedDestination.endStation?.name || selectedDestination.description}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Schedule:</Text>
                <Text style={styles.summaryValue}>
                  {getDayName(selectedSchedule.dayOfWeek)} ({selectedSchedule.startTime} - {selectedSchedule.endTime})
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Base Price:</Text>
                <Text style={styles.summaryValue}>${selectedDestination.basePrice}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>{selectedDestination.estimatedDuration} minutes</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <View style={styles.loadingButtonContent}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.loadingButtonText}>Declaring...</Text>
                </View>
              ) : (
                <Text style={styles.confirmButtonText}>
                  🚀 Declare Availability
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
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
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDotActive: {
    backgroundColor: '#007bff',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e9ecef',
    marginHorizontal: 16,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  horizontalList: {
    marginVertical: 8,
  },
  listContent: {
    paddingHorizontal: 4,
  },
  selectionItem: {
    padding: 16,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e9ecef',
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedItem: {
    borderColor: '#007bff',
    backgroundColor: '#e3f2fd',
  },
  selectionItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedItemTitle: {
    color: '#007bff',
  },
  selectionItemSubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  selectedItemSubtitle: {
    color: '#0056b3',
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 14,
  },
  confirmSection: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  confirmButton: {
    backgroundColor: '#007bff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});