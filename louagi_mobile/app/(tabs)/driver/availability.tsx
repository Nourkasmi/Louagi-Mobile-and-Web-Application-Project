// app/(tabs)/driver/availability.tsx - Driver Availability Declaration Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  getStations,
  getDestinations,
  getSchedules,
  declareAvailability,
  getDriverStatus,
  type Station,
  type Destination,
  type Schedule
} from '../../../src/services/api';

export default function DriverAvailabilityScreen() {
  const router = useRouter();
  
  // State management
  const [stations, setStations] = useState<Station[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  
  // Loading states
  const [loadingStations, setLoadingStations] = useState(true);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [declaring, setDeclaring] = useState(false);
  
  // Driver status
  const [driverStatus, setDriverStatus] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    loadStations();
    checkDriverStatus();
  }, []);

  // Check driver status to see if they can declare availability
  const checkDriverStatus = async () => {
    try {
      const response = await getDriverStatus();
      if (response.success && response.data) {
        setDriverStatus(response.data);
      }
    } catch (error) {
      console.error('Error checking driver status:', error);
    }
  };

  // Load all stations
  const loadStations = async () => {
    try {
      setLoadingStations(true);
      const response = await getStations({ limit: 50 });
      
      if (response.success && response.data) {
        setStations(response.data.stations || []);
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

  // Load destinations for selected station
  const loadDestinations = async (stationId: string) => {
    try {
      setLoadingDestinations(true);
      const response = await getDestinations(stationId, { limit: 50 });
      
      if (response.success && response.data) {
        setDestinations(response.data.destinations || []);
      } else {
        Alert.alert('Error', 'Failed to load destinations');
      }
    } catch (error) {
      console.error('Error loading destinations:', error);
      Alert.alert('Error', 'Failed to load destinations');
    } finally {
      setLoadingDestinations(false);
    }
  };

  // Load schedules for selected station
  const loadSchedules = async (stationId: string) => {
    try {
      setLoadingSchedules(true);
      // Note: You might need to create this API endpoint if it doesn't exist
      // For now, we'll create a mock schedule
      const today = new Date().getDay();
      const mockSchedule = {
        id: 'schedule-today',
        stationId: stationId,
        dayOfWeek: today,
        startTime: '08:00',
        endTime: '18:00',
        isActive: true,
        maxTrips: 10,
        notes: 'Daily schedule'
      };
      
      setSchedules([mockSchedule]);
      setSelectedSchedule(mockSchedule);
    } catch (error) {
      console.error('Error loading schedules:', error);
      Alert.alert('Error', 'Failed to load schedules');
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Handle station selection
  const handleStationSelection = (station: Station) => {
    setSelectedStation(station);
    setSelectedDestination(null);
    setSelectedSchedule(null);
    setDestinations([]);
    setSchedules([]);
    
    // Load destinations and schedules for this station
    loadDestinations(station.id);
    loadSchedules(station.id);
  };

  // Handle destination selection
  const handleDestinationSelection = (destination: Destination) => {
    setSelectedDestination(destination);
  };

  // Handle schedule selection
  const handleScheduleSelection = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
  };

  // Declare availability
  const handleDeclareAvailability = async () => {
    if (!selectedStation || !selectedDestination || !selectedSchedule) {
      Alert.alert('Incomplete Selection', 'Please select station, destination, and schedule');
      return;
    }

    Alert.alert(
      'Confirm Availability',
      `Declare availability for:\n\nStation: ${selectedStation.name}\nDestination: ${selectedDestination.endStation.name}\nSchedule: ${selectedSchedule.startTime} - ${selectedSchedule.endTime}\n\nThis will create a trip waiting for passengers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: performAvailabilityDeclaration }
      ]
    );
  };

  // Perform the actual availability declaration
  const performAvailabilityDeclaration = async () => {
    if (!selectedStation || !selectedDestination || !selectedSchedule) return;

    try {
      setDeclaring(true);
      
      const response = await declareAvailability({
        stationId: selectedStation.id,
        scheduleId: selectedSchedule.id,
        destinationId: selectedDestination.id
      });

      if (response.success && response.data) {
        Alert.alert(
          'Success! 🎉',
          response.data.wasAutoStarted 
            ? `Trip auto-started with ${response.data.autoConfirmedBookings} passengers!`
            : `Trip created successfully!\n\nWaiting for passengers: ${response.data.availableSeats}/${response.data.totalCapacity} seats available\n\nPosition: ${response.data.queuePosition}\nSystem: ${response.data.systemType}`,
          [
            {
              text: 'View Dashboard',
              onPress: () => router.replace('/(tabs)/driver')
            }
          ]
        );
        
        // Reset selections
        setSelectedStation(null);
        setSelectedDestination(null);
        setSelectedSchedule(null);
        setDestinations([]);
        setSchedules([]);
        
      } else {
        Alert.alert('Error', response.message || 'Failed to declare availability');
      }
    } catch (error) {
      console.error('Error declaring availability:', error);
      Alert.alert('Error', 'Failed to declare availability. Please try again.');
    } finally {
      setDeclaring(false);
    }
  };

  // Check if can declare availability
  const canDeclareAvailability = () => {
    return driverStatus?.canDeclareAvailability && 
           selectedStation && 
           selectedDestination && 
           selectedSchedule;
  };

  // Render station selection
  const renderStationSelection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>1. Select Station 🚉</Text>
      
      {loadingStations ? (
        <ActivityIndicator size="small" color="#007bff" />
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.selectionCard,
                selectedStation?.id === item.id && styles.selectedCard
              ]}
              onPress={() => handleStationSelection(item)}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.city}, {item.state}</Text>
              <Text style={styles.cardDetail}>{item.address}</Text>
              {selectedStation?.id === item.id && (
                <Text style={styles.selectedText}>✓ Selected</Text>
              )}
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
          style={styles.selectionList}
        />
      )}
    </View>
  );

  // Render destination selection
  const renderDestinationSelection = () => {
    if (!selectedStation) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Select Destination 🎯</Text>
        
        {loadingDestinations ? (
          <ActivityIndicator size="small" color="#007bff" />
        ) : destinations.length === 0 ? (
          <Text style={styles.emptyText}>No destinations available for this station</Text>
        ) : (
          <FlatList
            data={destinations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.selectionCard,
                  selectedDestination?.id === item.id && styles.selectedCard
                ]}
                onPress={() => handleDestinationSelection(item)}
              >
                <Text style={styles.cardTitle}>
                  {selectedStation.name} → {item.endStation.name}
                </Text>
                <Text style={styles.cardSubtitle}>{item.description}</Text>
                <View style={styles.cardDetails}>
                  <Text style={styles.cardDetail}>💰 ${item.basePrice}</Text>
                  <Text style={styles.cardDetail}>⏱️ {item.estimatedDuration} min</Text>
                  <Text style={styles.cardDetail}>📏 {item.distance} km</Text>
                </View>
                {selectedDestination?.id === item.id && (
                  <Text style={styles.selectedText}>✓ Selected</Text>
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            style={styles.selectionList}
          />
        )}
      </View>
    );
  };

  // Render schedule selection
  const renderScheduleSelection = () => {
    if (!selectedStation) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Schedule ⏰</Text>
        
        {loadingSchedules ? (
          <ActivityIndicator size="small" color="#007bff" />
        ) : schedules.length === 0 ? (
          <Text style={styles.emptyText}>No active schedules for today</Text>
        ) : (
          <FlatList
            data={schedules}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.selectionCard,
                  selectedSchedule?.id === item.id && styles.selectedCard
                ]}
                onPress={() => handleScheduleSelection(item)}
              >
                <Text style={styles.cardTitle}>
                  Today's Schedule
                </Text>
                <Text style={styles.cardSubtitle}>
                  {item.startTime} - {item.endTime}
                </Text>
                <Text style={styles.cardDetail}>
                  Max trips: {item.maxTrips} • {item.isActive ? 'Active' : 'Inactive'}
                </Text>
                {selectedSchedule?.id === item.id && (
                  <Text style={styles.selectedText}>✓ Selected</Text>
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            style={styles.selectionList}
          />
        )}
      </View>
    );
  };

  // Render summary and confirm button
  const renderSummary = () => {
    if (!selectedStation || !selectedDestination || !selectedSchedule) return null;

    return (
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>Summary 📋</Text>
        
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Station:</Text>
            <Text style={styles.summaryValue}>{selectedStation.name}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Destination:</Text>
            <Text style={styles.summaryValue}>{selectedDestination.endStation.name}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Route:</Text>
            <Text style={styles.summaryValue}>{selectedDestination.description}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Schedule:</Text>
            <Text style={styles.summaryValue}>
              {selectedSchedule.startTime} - {selectedSchedule.endTime}
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
          style={[
            styles.declareButton,
            (!canDeclareAvailability() || declaring) && styles.disabledButton
          ]}
          onPress={handleDeclareAvailability}
          disabled={!canDeclareAvailability() || declaring}
        >
          {declaring ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.declareButtonText}>
              🚀 Declare Availability
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Show driver status message if can't declare
  const renderStatusMessage = () => {
    if (!driverStatus) return null;

    if (!driverStatus.canDeclareAvailability) {
      return (
        <View style={styles.statusMessage}>
          <Text style={styles.statusIcon}>⚠️</Text>
          <Text style={styles.statusText}>{driverStatus.statusMessage}</Text>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => router.replace('/(tabs)/driver')}
          >
            <Text style={styles.statusButtonText}>View Dashboard</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Declare Availability</Text>
        <Text style={styles.subtitle}>Create a new trip and wait for passengers</Text>
      </View>

      {renderStatusMessage()}
      
      {driverStatus?.canDeclareAvailability && (
        <>
          {renderStationSelection()}
          {renderDestinationSelection()}
          {renderScheduleSelection()}
          {renderSummary()}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
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
  statusMessage: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 16,
  },
  statusButton: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  selectionList: {
    maxHeight: 300,
  },
  selectionCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  cardDetail: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectedText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
  summarySection: {
    margin: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    marginLeft: 12,
  },
  declareButton: {
    backgroundColor: '#007bff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  declareButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});