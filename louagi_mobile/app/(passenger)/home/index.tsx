// app/(passenger)/home/index.tsx 

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Platform,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { logout } from '../../../src/store/authSlice';
import { getStations, getMyBookings, type Station, type Booking } from '../../../src/services/api';
import { RootState } from '../../../src/store/store';
import { styles } from './index.styles';


const { width, height } = Dimensions.get('window');

// Helper to get real route names,
const getRouteNames = (booking) => {
    if (!booking?.trip?.route) {
        return { startName: null, endName: null };
    }
    const startName = booking.trip.route.startStation?.name || null;
    const endName = booking.trip.route.endStation?.name || null;

    if (startName && endName) {
        return { startName, endName };
    }
    // Try to parse from route description if stations are partially missing
    if (booking.trip.route.description) {
        const patterns = [
            /(.+?)\s*(?:to|→|-|->|–)\s*(.+)/i,
            /from\s+(.+?)\s+to\s+(.+)/i,
        ];
        for (const pattern of patterns) {
            const match = booking.trip.route.description.match(pattern);
            if (match && match[1] && match[2]) {
                return {
                    startName: startName || match[1].trim(),
                    endName: endName || match[2].trim()
                };
            }
        }
    }
    return { startName, endName };
};

export default function PassengerHomeScreen() {
  // State management
  const [stations, setStations] = useState<Station[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realStats, setRealStats] = useState({
    totalTrips: 0,
    pendingPayments: 0,
    nextTrip: null as Booking | null,
    totalSpent: 0,
    avgPerTrip: 0,
    completionRate: 0,
    co2Saved: 0,
    moneySaved: 0,
    confirmedTrips: 0,
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  // Helper functions
  const getFirstName = useCallback(() => {
    if (auth.user?.username) {
      return auth.user.username.split(' ')[0];
    }
    return 'Traveler';
  }, [auth.user?.username]);

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // 🔧 COMPLETELY FIXED: Real status calculation
  const getBookingStatus = (booking: Booking): 'pending' | 'confirmed' | 'completed' | 'cancelled' => {
    console.log(`🔍 Analyzing booking ${booking.bookingReference}:`, {
      bookingStatus: booking.status,
      paymentStatus: booking.paymentStatus,
      tripStatus: booking.trip?.status,
      amount: booking.amount,
      hasTrip: !!booking.trip,
      departureTime: booking.trip?.departureTime
    });

    // Check for cancellation first
    if (booking.status === 'cancelled' || booking.trip?.status === 'cancelled') {
      console.log(`❌ ${booking.bookingReference}: CANCELLED`);
      return 'cancelled';
    }

    // If payment is completed, consider the booking valid
    if (booking.paymentStatus === 'completed') {
      // Check if trip is completed
      if (booking.trip?.status === 'completed') {
        console.log(`✅ ${booking.bookingReference}: COMPLETED (paid + trip finished)`);
        return 'completed';
      }

      // Check if trip has happened (past departure time)
      if (booking.trip?.departureTime) {
        const departureTime = new Date(booking.trip.departureTime);
        const now = new Date();
        if (departureTime < now) {
          console.log(`✅ ${booking.bookingReference}: COMPLETED (paid + past departure)`);
          return 'completed';
        }
      }

      // Payment done but trip not yet happened or completed
      console.log(`✅ ${booking.bookingReference}: CONFIRMED (paid, waiting for trip)`);
      return 'confirmed';
    }

    // Check trip completion even without payment status
    if (booking.trip?.status === 'completed') {
      console.log(`✅ ${booking.bookingReference}: COMPLETED (trip finished)`);
      return 'completed';
    }

    // Check booking status directly
    if (booking.status === 'completed') {
      console.log(`✅ ${booking.bookingReference}: COMPLETED (booking status)`);
      return 'completed';
    }

    if (booking.status === 'confirmed') {
      console.log(`✅ ${booking.bookingReference}: CONFIRMED (booking status)`);
      return 'confirmed';
    }

    // Default to pending
    console.log(`⏳ ${booking.bookingReference}: PENDING (needs payment/confirmation)`);
    return 'pending';
  };

  // 🔧 COMPLETELY FIXED: Calculate REAL stats from actual bookings
  const calculateRealStats = (bookings: Booking[]) => {
    console.log('📊 ===== CALCULATING REAL STATS =====');
    console.log('📋 Total bookings to analyze:', bookings.length);

    if (!bookings || bookings.length === 0) {
      console.log('❌ No bookings to calculate stats from');
      return {
        totalTrips: 0,
        pendingPayments: 0,
        nextTrip: null,
        totalSpent: 0,
        avgPerTrip: 0,
        completionRate: 0,
        co2Saved: 0,
        moneySaved: 0,
        confirmedTrips: 0,
      };
    }

    // Process each booking with detailed logging
    const completedBookings: Booking[] = [];
    const confirmedBookings: Booking[] = [];
    const pendingBookings: Booking[] = [];
    const upcomingBookings: Booking[] = [];
    let totalMoneySpent = 0;

    bookings.forEach((booking, index) => {
      console.log(`\n📋 Processing booking ${index + 1}/${bookings.length}:`);
      const status = getBookingStatus(booking);

      // Parse amount safely
      let amount = 0;
      if (booking.amount) {
        if (typeof booking.amount === 'string') {
          amount = parseFloat(booking.amount);
        } else if (typeof booking.amount === 'number') {
          amount = booking.amount;
        }
      }

      console.log(`💰 Amount parsed: ${amount} (from ${booking.amount}, type: ${typeof booking.amount})`);

      // Categorize booking based on status
      switch (status) {
        case 'completed':
          completedBookings.push(booking);
          totalMoneySpent += amount;
          console.log(`✅ Added to COMPLETED: $${amount}, Total so far: $${totalMoneySpent}`);
          break;

        case 'confirmed':
          confirmedBookings.push(booking);
          totalMoneySpent += amount; // Count confirmed trips as spent money

          // Check if it's upcoming
          if (booking.trip?.departureTime) {
            const departureTime = new Date(booking.trip.departureTime);
            if (departureTime > new Date()) {
              upcomingBookings.push(booking);
              console.log(`🔜 Added to UPCOMING: ${booking.bookingReference}`);
            }
          }
          console.log(`✅ Added to CONFIRMED: $${amount}, Total so far: $${totalMoneySpent}`);
          break;

        case 'pending':
          pendingBookings.push(booking);
          console.log(`⏳ Added to PENDING: ${booking.bookingReference}`);
          break;

        case 'cancelled':
          console.log(`❌ CANCELLED: ${booking.bookingReference} (not counted)`);
          break;
      }
    });

    // Find next upcoming trip
    const nextTrip = upcomingBookings
      .sort((a, b) => {
        const dateA = new Date(a.trip?.departureTime || a.createdAt);
        const dateB = new Date(b.trip?.departureTime || b.createdAt);
        return dateA.getTime() - dateB.getTime();
      })[0] || null;

    // Calculate final metrics
    const totalCompleted = completedBookings.length;
    const totalConfirmed = confirmedBookings.length;
    const totalActive = totalCompleted + totalConfirmed; // Total meaningful trips
    const totalBookings = bookings.length;

    const avgPerTrip = totalActive > 0 ? totalMoneySpent / totalActive : 0;
    const completionRate = totalBookings > 0 ? Math.round((totalCompleted / totalBookings) * 100) : 0;

    // Environmental impact (based on all active trips)
    const co2Saved = totalActive * 2.5; // 2.5kg CO2 per shared trip vs driving alone

    // Money saved calculation (assume Louagi costs 60% of taxi/private transport)
    const estimatedTaxiCost = totalMoneySpent / 0.6;
    const moneySaved = estimatedTaxiCost - totalMoneySpent;

    const finalStats = {
      totalTrips: totalCompleted, // Only completed trips
      confirmedTrips: totalConfirmed, // Confirmed but not yet completed
      pendingPayments: pendingBookings.length,
      nextTrip,
      totalSpent: Math.round(totalMoneySpent * 100) / 100,
      avgPerTrip: Math.round(avgPerTrip * 100) / 100,
      completionRate,
      co2Saved: Math.round(co2Saved * 10) / 10,
      moneySaved: Math.round(moneySaved * 100) / 100,
    };

    console.log('\n📊 ===== FINAL REAL STATS =====');
    console.log('✅ Completed trips:', totalCompleted);
    console.log('🔄 Confirmed trips:', totalConfirmed);
    console.log('⏳ Pending payments:', pendingBookings.length);
    console.log('💰 Total spent: $', finalStats.totalSpent);
    console.log('📈 Average per trip: $', finalStats.avgPerTrip);
    console.log('🎯 Completion rate:', finalStats.completionRate + '%');
    console.log('🌱 CO2 saved:', finalStats.co2Saved + 'kg');
    console.log('💸 Money saved: $', finalStats.moneySaved);
    console.log('🔜 Next trip:', nextTrip?.bookingReference || 'None');
    console.log('=====================================\n');

    return finalStats;
  };

  // Fetch all data with REAL calculations
  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      console.log('📡 ===== FETCHING REAL DATA =====');

      // Fetch stations and bookings in parallel
      const [stationsResponse, bookingsResponse] = await Promise.all([
        getStations({ limit: 20 }),
        getMyBookings({ limit: 100 }), // Get more bookings for better stats
      ]);

      // Handle stations
      if (stationsResponse.success) {
        const stationsData = stationsResponse.data?.stations || stationsResponse.stations || [];
        setStations(stationsData);
        console.log('✅ Loaded stations:', stationsData.length);
      }

      // Handle bookings and calculate REAL stats
      if (bookingsResponse.success) {
        console.log('📡 Raw bookings response structure:', {
          success: bookingsResponse.success,
          hasData: !!bookingsResponse.data,
          dataKeys: bookingsResponse.data ? Object.keys(bookingsResponse.data) : [],
          hasBookings: !!bookingsResponse.data?.bookings,
          directBookings: !!bookingsResponse.bookings,
          isDataArray: Array.isArray(bookingsResponse.data)
        });

        // Extract bookings from different response structures
        let bookingsData: Booking[] = [];

        if (bookingsResponse.data?.bookings && Array.isArray(bookingsResponse.data.bookings)) {
          bookingsData = bookingsResponse.data.bookings;
          console.log('📋 Using response.data.bookings');
        } else if (Array.isArray(bookingsResponse.data)) {
          bookingsData = bookingsResponse.data;
          console.log('📋 Using response.data as array');
        } else if (bookingsResponse.bookings && Array.isArray(bookingsResponse.bookings)) {
          bookingsData = bookingsResponse.bookings;
          console.log('📋 Using response.bookings');
        } else {
          console.log('❌ Could not find bookings in response:', bookingsResponse);
          bookingsData = [];
        }

        console.log('📋 Extracted bookings count:', bookingsData.length);

        // Log first booking for debugging
        if (bookingsData.length > 0) {
          console.log('📋 Sample booking structure:', {
            id: bookingsData[0].id,
            reference: bookingsData[0].bookingReference,
            status: bookingsData[0].status,
            paymentStatus: bookingsData[0].paymentStatus,
            amount: bookingsData[0].amount,
            amountType: typeof bookingsData[0].amount,
            hasTrip: !!bookingsData[0].trip,
            tripStatus: bookingsData[0].trip?.status
          });
        }

        // Store all bookings and recent ones
        setAllBookings(bookingsData);
        setRecentBookings(bookingsData.slice(0, 4));

        // Calculate REAL statistics
        const calculatedStats = calculateRealStats(bookingsData);
        setRealStats(calculatedStats);

      } else {
        console.log('❌ Bookings fetch failed:', bookingsResponse.message);
        setAllBookings([]);
        setRecentBookings([]);
        setRealStats({
          totalTrips: 0,
          pendingPayments: 0,
          nextTrip: null,
          totalSpent: 0,
          avgPerTrip: 0,
          completionRate: 0,
          co2Saved: 0,
          moneySaved: 0,
          confirmedTrips: 0,
        });
      }

      if (!stationsResponse.success && stations.length === 0) {
        setError('Unable to load stations. Please check your connection.');
      }
    } catch (err: any) {
      console.error('❌ Error fetching home data:', err);
      setError('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Animation sequence
  const startAnimations = useCallback(() => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.9);
    heroAnim.setValue(0);
    statsAnim.setValue(0);

    // Orchestrated animation sequence
    Animated.sequence([
      // Hero section slides in first
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Stats fade in
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Main content animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim, heroAnim, statsAnim]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      startAnimations();
    }
  }, [loading, startAnimations]);

  // Navigation handlers
  const handleBookingPress = useCallback((booking: Booking) => {
    router.push({
      pathname: '/(passenger)/bookings/[id]',
      params: {
        id: booking.id,
        bookingData: JSON.stringify(booking)
      }
    });
  }, [router]);

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('louagi_token');
              global.authToken = undefined;
              dispatch(logout());
              router.replace('/login');
            } catch (error) {
              dispatch(logout());
              router.replace('/login');
            }
          }
        }
      ]
    );
  };

  const handleSearchTrips = () => {
    router.push('/(passenger)/search');
  };

  const handleQuickStationSelect = (station: Station) => {
    router.push({
      pathname: '/(passenger)/search',
      params: {
        selectedStationId: station.id,
        selectedStationName: station.name
      }
    });
  };

  // Format helpers
  const formatTime = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid time';
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  }, []);

  // Render animated hero section
  const renderAnimatedHero = () => (
    <Animated.View
      style={[
        modernStyles.heroSection,
        {
          opacity: heroAnim,
          transform: [{
            translateY: heroAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-50, 0]
            })
          }]
        }
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0066cc" />

      {/* User greeting with scale animation */}
      <Animated.View
        style={[
          modernStyles.userGreeting,
          {
            transform: [{
              scale: heroAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1]
              })
            }]
          }
        ]}
      >
        <View style={modernStyles.greetingContent}>
          <Text style={modernStyles.greeting}>{getGreeting()},</Text>
          <Text style={modernStyles.userName}>{getFirstName()}! 👋</Text>
          <Text style={modernStyles.welcomeSubtext}>Ready for your next journey?</Text>
        </View>

        <View style={modernStyles.headerActions}>
          <TouchableOpacity
            style={modernStyles.profileButton}
            onPress={() => router.push('/(passenger)/profile')}
          >
            <View style={modernStyles.avatar}>
              <Text style={modernStyles.avatarText}>
                {auth.user?.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={modernStyles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Enhanced Search Section with floating animation */}
      <Animated.View
        style={[
          modernStyles.searchSection,
          {
            transform: [{
              translateY: heroAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0]
              })
            }]
          }
        ]}
      >
        <Text style={modernStyles.searchTitle}>Where are you heading?</Text>
        <Text style={modernStyles.searchSubtitle}>Discover routes across Tunisia 🇹🇳</Text>

        <TouchableOpacity
          style={modernStyles.searchButton}
          onPress={handleSearchTrips}
          activeOpacity={0.9}
        >
          <MaterialIcons name="search" size={24} color="#0066cc" />
          <Text style={modernStyles.searchButtonText}>Search destinations & routes</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#0066cc" />
        </TouchableOpacity>

        {/* Quick Action Pills */}
        <View style={modernStyles.quickActionsRow}>
          <TouchableOpacity
            style={modernStyles.quickAction}
            onPress={() => router.push('/(passenger)/bookings')}
          >
            <MaterialIcons name="history" size={18} color="#ffffff" />
            <Text style={modernStyles.quickActionText}>My Trips</Text>
            {realStats.pendingPayments > 0 && (
              <View style={modernStyles.notificationDot}>
                <Text style={modernStyles.notificationText}>{realStats.pendingPayments}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={modernStyles.quickAction}
            onPress={() => router.push('/(passenger)/search')}
          >
            <MaterialIcons name="directions" size={18} color="#ffffff" />
            <Text style={modernStyles.quickActionText}>Routes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={modernStyles.quickAction}
            onPress={() => Alert.alert('Support', 'Contact: support@louagi.com\nPhone: +216 58 996 355')}
          >
            <MaterialIcons name="help-outline" size={18} color="#ffffff" />
            <Text style={modernStyles.quickActionText}>Help</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );

  // 🔧 COMPLETELY FIXED: Render REAL stats with actual data
  const renderRealStats = () => (
    <Animated.View
      style={[
        modernStyles.statsContainer,
        {
          opacity: statsAnim,
          transform: [{
            translateY: statsAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }]
        }
      ]}
    >
      <View style={modernStyles.statsHeader}>
        <MaterialIcons name="analytics" size={24} color="#0066cc" />
        <Text style={modernStyles.statsTitle}>
          {realStats.totalTrips > 0 || realStats.confirmedTrips > 0 ? 'Your Real Travel Impact' : 'Ready to Start Your Journey?'}
        </Text>
      </View>

      <View style={modernStyles.statsRow}>
        {/* REAL Completed Trips */}
        <Animated.View
          style={[
            modernStyles.statItem,
            {
              transform: [{
                scale: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}
        >
          <MaterialIcons name="done-all" size={20} color="#4caf50" />
          <Text style={[modernStyles.statNumber, { color: '#4caf50' }]}>{realStats.totalTrips}</Text>
          <Text style={modernStyles.statLabel}>Completed{'\n'}Trips</Text>
        </Animated.View>

        {/* REAL Confirmed Trips */}
        <Animated.View
          style={[
            modernStyles.statItem,
            {
              transform: [{
                scale: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}
        >
          <MaterialIcons name="verified" size={20} color="#2196f3" />
          <Text style={[modernStyles.statNumber, { color: '#2196f3' }]}>{realStats.confirmedTrips}</Text>
          <Text style={modernStyles.statLabel}>Confirmed{'\n'}Trips</Text>
        </Animated.View>

        {/* REAL Money Spent */}
        <Animated.View
          style={[
            modernStyles.statItem,
            {
              transform: [{
                scale: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}
        >
          <MaterialIcons name="payments" size={20} color="#28a745" />
          <Text style={[modernStyles.statNumber, { color: '#28a745' }]}>
            ${realStats.totalSpent}
          </Text>
          <Text style={modernStyles.statLabel}>Total{'\n'}Spent</Text>
        </Animated.View>

        {/* REAL Average Cost or Pending Payments */}
        <Animated.View
          style={[
            modernStyles.statItem,
            {
              transform: [{
                scale: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}
        >
          {realStats.pendingPayments > 0 ? (
            <>
              <MaterialIcons name="payment" size={20} color="#ff9800" />
              <Text style={[modernStyles.statNumber, { color: '#ff9800' }]}>{realStats.pendingPayments}</Text>
              <Text style={modernStyles.statLabel}>Pending{'\n'}Payments</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="trending-down" size={20} color="#ff9800" />
              <Text style={[modernStyles.statNumber, { color: '#ff9800' }]}>
                ${realStats.avgPerTrip}
              </Text>
              <Text style={modernStyles.statLabel}>Avg per{'\n'}Trip</Text>
            </>
          )}
        </Animated.View>
      </View>

      {/* Stats footer */}
      <View style={modernStyles.statsFooter}>
        <Text style={modernStyles.statsFooterText}>
          {allBookings.length > 0 ?
            `Based on your ${allBookings.length} booking${allBookings.length > 1 ? 's' : ''}` :
            'Book your first trip to see personalized stats!'
          }
        </Text>
      </View>
    </Animated.View>
  );

  // Render next trip with REAL data
  const renderNextTrip = () => {
    if (!realStats.nextTrip) return null;

    const trip = realStats.nextTrip;
    return (
      <Animated.View
        style={[
          modernStyles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={modernStyles.sectionHeader}>
          <MaterialIcons name="upcoming" size={24} color="#0066cc" />
          <Text style={modernStyles.sectionTitle}>🎫 Your Next Adventure</Text>
        </View>

        <TouchableOpacity
          style={modernStyles.nextTripCard}
          onPress={() => handleBookingPress(trip)}
          activeOpacity={0.95}
        >
          <View style={modernStyles.tripCardBackground}>
            <View style={modernStyles.tripHeader}>
              <View style={modernStyles.routeInfo}>
                <Text style={modernStyles.routeText}>
                  {trip.trip?.route?.startStation?.name || 'Departure'} → {trip.trip?.route?.endStation?.name || 'Destination'}
                </Text>
                <View style={modernStyles.tripTimeContainer}>
                  <MaterialIcons name="schedule" size={16} color="#666" />
                  <Text style={modernStyles.tripTime}>
                    {trip.trip?.departureTime ? formatTime(trip.trip.departureTime) : 'When full'} • {trip.trip?.departureTime ? formatDate(trip.trip.departureTime) : 'Today'}
                  </Text>
                </View>
              </View>

              <View style={modernStyles.tripBadge}>
                <MaterialIcons name="verified" size={16} color="#28a745" />
                <Text style={modernStyles.tripBadgeText}>Confirmed</Text>
              </View>
            </View>

            <View style={modernStyles.tripDetails}>
              <View style={modernStyles.tripDetailItem}>
                <MaterialIcons name="people" size={16} color="#666" />
                <Text style={modernStyles.tripDetailText}>{trip.seats} seat{trip.seats > 1 ? 's' : ''}</Text>
              </View>

              <View style={modernStyles.tripDetailItem}>
                <MaterialIcons name="payment" size={16} color="#666" />
                <Text style={modernStyles.tripDetailText}>${trip.amount || '0.00'}</Text>
              </View>

              <View style={modernStyles.tripDetailItem}>
                <MaterialIcons name="confirmation-number" size={16} color="#666" />
                <Text style={modernStyles.tripDetailText}>#{trip.bookingReference}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render recent activity with REAL data
  const renderRecentActivity = () => {
    if (recentBookings.length === 0) return null;

    return (
      <Animated.View
        style={[
          modernStyles.section,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={modernStyles.sectionHeader}>
          <MaterialIcons name="history" size={24} color="#0066cc" />
          <Text style={modernStyles.sectionTitle}>📋 Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(passenger)/bookings')}>
            <Text style={modernStyles.seeAllLink}>View all</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.map((booking, index) => {
          const status = getBookingStatus(booking);
          return (
            <Animated.View
              key={booking.id}
              style={[
                modernStyles.activityCard,
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    })
                  }]
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => handleBookingPress(booking)}
                style={modernStyles.activityContent}
                activeOpacity={0.9}
              >
                <View style={modernStyles.activityLeft}>
                  <View style={[modernStyles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <View style={modernStyles.bookingRoute}>
                  {(() => {
  const { startName, endName } = getRouteNames(booking);
  return (
    <Text style={modernStyles.activityTitle}>
      {startName && endName ? `${startName} → ${endName}` : 'Route unavailable'}
    </Text>
  );
})()}
                    <Text style={modernStyles.activitySubtitle}>
                      {formatDate(booking.trip?.departureTime || booking.createdAt)} • {booking.seats} seat{booking.seats > 1 ? 's' : ''}
                    </Text>
                    <Text style={modernStyles.bookingReference}>#{booking.bookingReference}</Text>
                  </View>
                </View>

                <View style={modernStyles.activityRight}>
                  <Text style={[modernStyles.statusText, { color: getStatusColor(status) }]}>
                    {getStatusIcon(status)} {status}
                  </Text>
                  <Text style={modernStyles.bookingAmount}>${booking.amount || '0.00'}</Text>
                  <MaterialIcons name="chevron-right" size={20} color="#ccc" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Animated.View>
    );
  };

  // Render popular stations
  const renderPopularStations = () => (
    <Animated.View
      style={[
        modernStyles.section,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={modernStyles.sectionHeader}>
        <MaterialIcons name="location-on" size={24} color="#0066cc" />
        <Text style={modernStyles.sectionTitle}>🌟 Popular Destinations</Text>
        <TouchableOpacity onPress={() => router.push('/(passenger)/search')}>
          <Text style={modernStyles.seeAllLink}>View all ({stations.length})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={stations.slice(0, 6)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={modernStyles.stationsHorizontalList}
        renderItem={({ item, index }) => (
          <Animated.View
            style={[
              modernStyles.stationCardHorizontal,
              {
                opacity: fadeAnim,
                transform: [{
                  scale: scaleAnim
                }]
              }
            ]}
          >
            <TouchableOpacity
              onPress={() => handleQuickStationSelect(item)}
              style={modernStyles.stationCardContent}
              activeOpacity={0.9}
            >
              <View style={modernStyles.stationIcon}>
                <MaterialIcons name="location-city" size={28} color="#0066cc" />
              </View>

              <Text style={modernStyles.stationName} numberOfLines={1}>{item.name}</Text>
              <Text style={modernStyles.stationLocation} numberOfLines={1}>
                {item.city}, {item.state}
              </Text>

              {item.amenities && Object.keys(item.amenities).length > 0 && (
                <View style={modernStyles.amenitiesRow}>
                  <MaterialIcons name="star" size={12} color="#ffc107" />
                  <Text style={modernStyles.amenitiesText}>
                    {Object.keys(item.amenities).length} amenities
                  </Text>
                </View>
              )}

              <View style={modernStyles.stationCardAction}>
                <MaterialIcons name="arrow-forward" size={16} color="#0066cc" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Search All Stations Button */}
      {stations.length > 6 && (
        <TouchableOpacity
          style={modernStyles.searchAllButton}
          onPress={() => router.push('/(passenger)/search')}
          activeOpacity={0.9}
        >
          <MaterialIcons name="explore" size={20} color="#0066cc" />
          <Text style={modernStyles.searchAllButtonText}>
            Explore all {stations.length} stations
          </Text>
          <MaterialIcons name="arrow-forward" size={16} color="#0066cc" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  // Helper functions for status
  const getStatusColor = (status: string) => {
    const colors = {
      'pending': '#ff9800',
      'confirmed': '#4caf50',
      'completed': '#2196f3',
      'cancelled': '#f44336',
    };
    return colors[status as keyof typeof colors] || '#9e9e9e';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '✅',
      'completed': '🎉',
      'cancelled': '❌',
    };
    return icons[status as keyof typeof icons] || '❓';
  };

  // Loading state
  if (loading && stations.length === 0) {
    return (
      <View style={styles.container}>
        {renderAnimatedHero()}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading your real dashboard...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error && stations.length === 0) {
    return (
      <View style={styles.container}>
        {renderAnimatedHero()}
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={64} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
            <Text style={styles.retryButtonText}>🔄 Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            colors={['#0066cc']}
            tintColor="#0066cc"
            progressBackgroundColor="#ffffff"
          />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {renderAnimatedHero()}
        {renderRealStats()}
        {renderNextTrip()}
        {renderRecentActivity()}
        {renderPopularStations()}

        {/* App info footer */}
        <Animated.View
          style={[
            modernStyles.footer,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <Text style={modernStyles.footerText}>
            Louagi • Connecting Tunisia, one journey at a time
          </Text>
          <Text style={modernStyles.versionText}>v1.0.0 • Made with ❤️ in Tunisia 🇹🇳</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Enhanced modern styles with real data emphasis
const modernStyles = {
  // Hero Section with gradient background
  heroSection: {
    backgroundColor: '#0066cc',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },

  userGreeting: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 30,
    zIndex: 1,
  },

  greetingContent: {
    flex: 1,
  },

  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },

  userName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 4,
  },

  welcomeSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic' as const,
  },

  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },

  profileButton: {
    padding: 4,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#ffffff',
  },

  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Enhanced Search Section
  searchSection: {
    alignItems: 'center' as const,
    marginBottom: 30,
    zIndex: 1,
  },

  searchTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center' as const,
  },

  searchSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    textAlign: 'center' as const,
  },

  searchButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    gap: 12,
    marginBottom: 20,
    minWidth: width * 0.85,
  },

  searchButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0066cc',
    flex: 1,
  },

  quickActionsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    width: '100%',
    gap: 12,
  },

  quickAction: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center' as const,
    gap: 6,
    position: 'relative' as const,
  },

  quickActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#ffffff',
  },

  notificationDot: {
    position: 'absolute' as const,
    top: -8,
    right: 8,
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#0066cc',
  },

  notificationText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#ffffff',
  },

  // REAL Stats Container
  statsContainer: {
    marginHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  statsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },

  statsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#333',
    marginLeft: 8,
  },

  statsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },

  statItem: {
    alignItems: 'center' as const,
    gap: 8,
    flex: 1,
  },

  statNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0066cc',
  },

  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: 14,
  },

  // Environmental Impact Row
  impactRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },

  impactItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },

  impactText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600' as const,
  },

  // Pending payments alert
  pendingAlert: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },

  pendingText: {
    flex: 1,
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: '500' as const,
    marginLeft: 8,
  },

  // Stats footer for additional info
  statsFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },

  statsFooterText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },

  seeAllLink: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600' as const,
  },

  // Next Trip Card
  nextTripCard: {
    borderRadius: 16,
    overflow: 'hidden' as const,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  tripCardBackground: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },

  tripHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },

  routeInfo: {
    flex: 1,
  },

  routeText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#333',
    marginBottom: 8,
  },

  tripTimeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },

  tripTime: {
    fontSize: 14,
    color: '#666',
  },

  tripBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },

  tripBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#28a745',
  },

  tripDetails: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },

  tripDetailItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },

  tripDetailText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500' as const,
  },

  // Activity Cards
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden' as const,
  },

  activityContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },

  activityLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },

  bookingRoute: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
  },

  activitySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },

  bookingReference: {
    fontSize: 11,
    color: '#0066cc',
    fontWeight: '500' as const,
  },

  activityRight: {
    alignItems: 'flex-end' as const,
    gap: 4,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },

  bookingAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#333',
  },

  // Horizontal Station Cards
  stationsHorizontalList: {
    paddingLeft: 20,
    paddingRight: 20,
  },

  stationCardHorizontal: {
    width: 140,
    marginRight: 12,
  },

  stationCardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 160,
    justifyContent: 'space-between' as const,
  },

  stationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },

  stationName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 4,
    textAlign: 'center' as const,
  },

  stationLocation: {
    fontSize: 11,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center' as const,
  },

  amenitiesRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 2,
    marginBottom: 8,
  },

  amenitiesText: {
    fontSize: 9,
    color: '#ffc107',
    fontWeight: '500' as const,
  },

  stationCardAction: {
    marginTop: 'auto' as const,
  },

  searchAllButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#0066cc',
    gap: 8,
  },

  searchAllButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0066cc',
  },

  // Footer
  footer: {
    alignItems: 'center' as const,
    padding: 24,
    paddingBottom: 40,
  },

  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center' as const,
  },

  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center' as const,
  },
};