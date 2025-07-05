// 📁 app/(driver)/earnings/index.tsx - ENHANCED WITH REAL DATA & CHARTS
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  getDriverEarnings,
  getDriverTrips,
  type Trip
} from '../../../src/services/api';
import { styles } from './index.style';
import { theme } from '../../../src/styles/theme';

// Simple chart components (since we can't use external chart libraries in this environment)
const SimpleLineChart = ({ data, width, height }: { data: number[], width: number, height: number }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  return (
    <View style={{ width, height, backgroundColor: theme.colors.background.light, borderRadius: 8 }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {/* Simple line representation */}
        {points.map((point, index) => (
          <View
            key={index}
            style={{
              position: 'absolute',
              left: point.x - 2,
              top: point.y - 2,
              width: 4,
              height: 4,
              backgroundColor: theme.colors.primary,
              borderRadius: 2,
            }}
          />
        ))}
      </View>
    </View>
  );
};

const SimpleBarChart = ({ data, labels, width, height }: {
  data: number[],
  labels: string[],
  width: number,
  height: number
}) => {
  const max = Math.max(...data);
  const barWidth = width / data.length - 8;

  return (
    <View style={{ width, height }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: height - 30 }}>
        {data.map((value, index) => {
          const barHeight = (value / max) * (height - 30);
          return (
            <View key={index} style={{ marginHorizontal: 4, alignItems: 'center' }}>
              <View
                style={{
                  width: barWidth,
                  height: barHeight,
                  backgroundColor: theme.colors.primary,
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <Text style={[styles.chartLabel, { width: barWidth }]}>
                {labels[index]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

type PeriodType = 'today' | 'week' | 'month' | 'year';

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

interface DailyEarnings {
  date: string;
  earnings: number;
  trips: number;
}

const { width } = Dimensions.get('window');

export default function DriverEarningsScreen() {
  const router = useRouter();

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // State management
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarnings[]>([]);
  const [weeklyData, setWeeklyData] = useState<number[]>([]);

  // Initialize animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch earnings data
  const fetchEarningsData = useCallback(async (period: PeriodType, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { startDate, endDate } = getPeriodDates(period);

      // Fetch earnings and trips data
      const [earningsResponse, tripsResponse] = await Promise.all([
        getDriverEarnings({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        }),
        getDriverTrips({ limit: 100 })
      ]);

      if (earningsResponse.success && earningsResponse.data) {
        setEarnings(earningsResponse.data.earnings);
      }

      if (tripsResponse.success && tripsResponse.data) {
        const allTrips = tripsResponse.data.trips || [];

        // Filter trips by date range
        const filteredTrips = allTrips.filter(trip => {
          const tripDate = new Date(trip.createdAt);
          return tripDate >= startDate && tripDate <= endDate;
        });

        setTrips(filteredTrips);

        // Calculate daily earnings for chart
        const dailyData = calculateDailyEarnings(filteredTrips, startDate, endDate);
        setDailyEarnings(dailyData);

        // Calculate weekly data for bar chart
        const weeklyData = calculateWeeklyData(filteredTrips);
        setWeeklyData(weeklyData);
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
    }

    return { startDate, endDate };
  };

  // Calculate daily earnings for line chart
  const calculateDailyEarnings = (trips: Trip[], startDate: Date, endDate: Date): DailyEarnings[] => {
    const days: DailyEarnings[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayTrips = trips.filter(trip => {
        const tripDate = new Date(trip.createdAt);
        return tripDate.toDateString() === currentDate.toDateString();
      });

      const dayEarnings = dayTrips.reduce((sum, trip) => {
        if (trip.status === 'completed') {
          const bookedSeats = trip.capacity - trip.availableSeats;
          const revenue = (trip.currentPrice / trip.capacity) * bookedSeats;
          return sum + (revenue * 0.8); // 80% to driver
        }
        return sum;
      }, 0);

      days.push({
        date: currentDate.toISOString().split('T')[0],
        earnings: dayEarnings,
        trips: dayTrips.length
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // Calculate weekly data for bar chart
  const calculateWeeklyData = (trips: Trip[]): number[] => {
    const weeklyEarnings = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday

    trips.forEach(trip => {
      if (trip.status === 'completed') {
        const tripDate = new Date(trip.createdAt);
        const dayOfWeek = tripDate.getDay();
        const bookedSeats = trip.capacity - trip.availableSeats;
        const revenue = (trip.currentPrice / trip.capacity) * bookedSeats;
        weeklyEarnings[dayOfWeek] += revenue * 0.8;
      }
    });

    return weeklyEarnings;
  };

  // Initial load
  useEffect(() => {
    fetchEarningsData(selectedPeriod);
  }, [selectedPeriod, fetchEarningsData]);

  // Handle period change
  const handlePeriodChange = (period: PeriodType) => {
    setSelectedPeriod(period);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2,
    }).format(amount);
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

    // Calculate hourly rate (assuming 1.5 hours per trip)
    const estimatedHours = completedTrips.length * 1.5;
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading earnings data...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Earnings</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {['today', 'week', 'month', 'year'].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive
            ]}
            onPress={() => handlePeriodChange(period as PeriodType)}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === period && styles.periodButtonTextActive
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEarningsData(selectedPeriod, true)}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Main Earnings Summary */}
        {earnings && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Earnings Summary 💰</Text>

            <View style={styles.mainEarnings}>
              <Text style={styles.totalEarnings}>
                {formatCurrency(earnings.totalEarnings)}
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
                  {formatCurrency(earnings.averageEarningsPerTrip)}
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
        )}

        {/* Earnings Chart */}
        {dailyEarnings.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Daily Earnings Trend 📈</Text>
            <View style={styles.chartContainer}>
              <SimpleLineChart
                data={dailyEarnings.map(d => d.earnings)}
                width={width - 64}
                height={180}
              />
            </View>
            <Text style={styles.chartNote}>
              Shows your daily earnings over the selected period
            </Text>
          </View>
        )}

        {/* Weekly Performance Bar Chart */}
        {weeklyData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.cardTitle}>Weekly Performance 📊</Text>
            <View style={styles.chartContainer}>
              <SimpleBarChart
                data={weeklyData}
                labels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
                width={width - 64}
                height={200}
              />
            </View>
            <Text style={styles.chartNote}>
              Earnings by day of the week
            </Text>
          </View>
        )}

        {/* Performance Metrics */}
        {metrics && (
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
                  {formatCurrency(metrics.dailyAverage)}
                </Text>
                <Text style={styles.metricLabel}>Daily Average</Text>
              </View>

              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>
                  {formatCurrency(metrics.hourlyRate)}
                </Text>
                <Text style={styles.metricLabel}>Hourly Rate</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Earnings Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.cardTitle}>Recent Earnings 📈</Text>

          {dailyEarnings.slice(-7).reverse().map((day, index) => (
            <View key={day.date} style={styles.breakdownItem}>
              <View style={styles.breakdownInfo}>
                <Text style={styles.breakdownDate}>
                  {new Date(day.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
                <Text style={styles.breakdownTrips}>
                  {day.trips} trip{day.trips !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.breakdownEarnings}>
                {formatCurrency(day.earnings)}
              </Text>
            </View>
          ))}
        </View>

        {/* Tips for Better Earnings */}
        <View style={styles.tipsCard}>
          <Text style={styles.cardTitle}>💡 Tips to Increase Earnings</Text>

          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>
              • Drive during peak hours (7-9 AM, 5-7 PM) for higher demand
            </Text>
            <Text style={styles.tipItem}>
              • Maintain a high rating (4.5+) for priority bookings
            </Text>
            <Text style={styles.tipItem}>
              • Keep your vehicle clean and comfortable
            </Text>
            <Text style={styles.tipItem}>
              • Be available at popular stations and destinations
            </Text>
            <Text style={styles.tipItem}>
              • Complete trips consistently to build good relationships
            </Text>
          </View>
        </View>

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

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
}