// app/(tabs)/driver/earnings.tsx - Driver Earnings Screen
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  getDriverEarnings,
  getDriverTrips,
  type Trip
} from '../../../src/services/api';

type PeriodType = 'today' | 'week' | 'month' | 'year' | 'custom';

interface EarningsData {
  totalEarnings: number;
  totalTrips: number;
  totalPassengers: number;
  averageEarningsPerTrip: number;
  averagePassengersPerTrip: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

const { width } = Dimensions.get('window');

export default function DriverEarningsScreen() {
  const router = useRouter();
  
  // State management
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');

  // Fetch earnings data
  const fetchEarningsData = useCallback(async (period: PeriodType, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { startDate, endDate } = getPeriodDates(period);

      // Fetch earnings
      const earningsResponse = await getDriverEarnings({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });

      if (earningsResponse.success && earningsResponse.data) {
        setEarnings(earningsResponse.data.earnings);
      }

      // Fetch trips for the period
      const tripsResponse = await getDriverTrips({
        limit: 100, // Get more trips for analysis
      });

      if (tripsResponse.success && tripsResponse.data) {
        // Filter trips by date
        const filteredTrips = tripsResponse.data.trips.filter(trip => {
          const tripDate = new Date(trip.createdAt);
          return tripDate >= startDate && tripDate <= endDate;
        });
        setTrips(filteredTrips);
      }

    } catch (error) {
      console.error('Error fetching earnings data:', error);
      Alert.alert('Error', 'Failed to load earnings data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Get date range for selected period
  const getPeriodDates = (period: PeriodType) => {
    const now = new Date();
    const endDate = new Date(now);
    let startDate = new Date(now);

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return { startDate, endDate };
  };

  // Initial load
  useEffect(() => {
    fetchEarningsData(selectedPeriod);
  }, [selectedPeriod, fetchEarningsData]);

  // Handle period change
  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
  };

  // Calculate additional metrics
  const calculateMetrics = () => {
    if (!earnings || !trips.length) return null;

    const completedTrips = trips.filter(trip => trip.status === 'completed');
    const cancelledTrips = trips.filter(trip => trip.status === 'cancelled');
    
    const completionRate = trips.length > 0 ? 
      (completedTrips.length / trips.length * 100).toFixed(1) : '0';
    
    const cancellationRate = trips.length > 0 ? 
      (cancelledTrips.length / trips.length * 100).toFixed(1) : '0';

    // Calculate daily average
    const { startDate, endDate } = getPeriodDates(selectedPeriod);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyAverage = earnings.totalEarnings / daysDiff;

    // Calculate hourly rate (assuming 8 hours per day)
    const estimatedHours = completedTrips.length * 1.5; // Assuming 1.5 hours per trip
    const hourlyRate = estimatedHours > 0 ? earnings.totalEarnings / estimatedHours : 0;

    return {
      completionRate,
      cancellationRate,
      dailyAverage,
      hourlyRate,
      daysDiff,
    };
  };

  const metrics = calculateMetrics();

  // Render period selector
  const renderPeriodSelector = () => {
    const periods: { key: PeriodType; label: string }[] = [
      { key: 'today', label: 'Today' },
      { key: 'week', label: 'Week' },
      { key: 'month', label: 'Month' },
      { key: 'year', label: 'Year' },
    ];

    return (
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive
            ]}
            onPress={() => handlePeriodChange(period.key)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive
            ]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render earnings summary
  const renderEarningsSummary = () => {
    if (!earnings) return null;

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Earnings Summary 💰</Text>
        
        <View style={styles.mainEarnings}>
          <Text style={styles.totalEarnings}>
            ${earnings.totalEarnings.toFixed(2)}
          </Text>
          <Text style={styles.totalEarningsLabel}>
            Total Earnings ({selectedPeriod})
          </Text>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{earnings.totalTrips}</Text>
            <Text style={styles.summaryLabel}>Trips</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{earnings.totalPassengers}</Text>
            <Text style={styles.summaryLabel}>Passengers</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              ${earnings.averageEarningsPerTrip.toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>Avg/Trip</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {earnings.averagePassengersPerTrip.toFixed(1)}
            </Text>
            <Text style={styles.summaryLabel}>Avg Passengers</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render performance metrics
  const renderPerformanceMetrics = () => {
    if (!metrics) return null;

    return (
      <View style={styles.metricsCard}>
        <Text style={styles.cardTitle}>Performance Metrics 📊</Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{metrics.completionRate}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>{metrics.cancellationRate}%</Text>
            <Text style={styles.metricLabel}>Cancellation Rate</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>
              ${metrics.dailyAverage.toFixed(2)}
            </Text>
            <Text style={styles.metricLabel}>Daily Average</Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={styles.metricNumber}>
              ${metrics.hourlyRate.toFixed(2)}
            </Text>
            <Text style={styles.metricLabel}>Hourly Rate</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render recent earnings breakdown
  const renderEarningsBreakdown = () => {
    const completedTrips = trips.filter(trip => trip.status === 'completed');
    
    if (completedTrips.length === 0) {
      return (
        <View style={styles.breakdownCard}>
          <Text style={styles.cardTitle}>Recent Earnings 📈</Text>
          <View style={styles.emptyBreakdown}>
            <Text style={styles.emptyText}>No completed trips in this period</Text>
          </View>
        </View>
      );
    }

    // Group trips by date
    const tripsByDate = completedTrips.reduce((acc, trip) => {
      const date = new Date(trip.actualArrivalTime || trip.createdAt).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(trip);
      return acc;
    }, {} as Record<string, Trip[]>);

    return (
      <View style={styles.breakdownCard}>
        <Text style={styles.cardTitle}>Recent Earnings 📈</Text>
        
        {Object.entries(tripsByDate)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .slice(0, 7) // Show last 7 days
          .map(([date, dayTrips]) => {
            const dayEarnings = dayTrips.reduce((sum, trip) => {
              const bookedSeats = trip.capacity - trip.availableSeats;
              const revenue = (trip.currentPrice / trip.capacity) * bookedSeats;
              return sum + (revenue * 0.8); // 80% to driver
            }, 0);

            return (
              <View key={date} style={styles.breakdownItem}>
                <View style={styles.breakdownInfo}>
                  <Text style={styles.breakdownDate}>{date}</Text>
                  <Text style={styles.breakdownTrips}>
                    {dayTrips.length} trip{dayTrips.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.breakdownEarnings}>
                  ${dayEarnings.toFixed(2)}
                </Text>
              </View>
            );
          })}
      </View>
    );
  };

  // Render earnings tips
  const renderEarningsTips = () => (
    <View style={styles.tipsCard}>
      <Text style={styles.cardTitle}>💡 Tips to Increase Earnings</Text>
      
      <View style={styles.tipsList}>
        <Text style={styles.tipItem}>
          • Declare availability during peak hours (7-9 AM, 5-7 PM)
        </Text>
        <Text style={styles.tipItem}>
          • Complete trips consistently to build good ratings
        </Text>
        <Text style={styles.tipItem}>
          • Provide excellent customer service for higher ratings
        </Text>
        <Text style={styles.tipItem}>
          • Stay available at popular stations and destinations
        </Text>
        <Text style={styles.tipItem}>
          • Keep your vehicle clean and comfortable
        </Text>
      </View>
    </View>
  );

  if (loading && !earnings) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading earnings data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchEarningsData(selectedPeriod, true)}
          colors={['#007bff']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {renderPeriodSelector()}
      {renderEarningsSummary()}
      {renderPerformanceMetrics()}
      {renderEarningsBreakdown()}
      {renderEarningsTips()}

      {/* Export Button */}
      <TouchableOpacity
        style={styles.exportButton}
        onPress={() => {
          Alert.alert(
            'Export Earnings',
            'Earnings export feature coming soon! You\'ll be able to download detailed reports.',
            [{ text: 'OK' }]
          );
        }}
      >
        <Text style={styles.exportButtonText}>📊 Export Report</Text>
      </TouchableOpacity>
    </ScrollView>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#007bff',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  summaryCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  mainEarnings: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  totalEarnings: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  totalEarningsLabel: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  metricsCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  breakdownCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyBreakdown: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownInfo: {
    flex: 1,
  },
  breakdownDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  breakdownTrips: {
    fontSize: 12,
    color: '#666',
  },
  breakdownEarnings: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  tipsCard: {
    backgroundColor: '#e8f4f8',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  exportButton: {
    backgroundColor: '#28a745',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  exportButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});