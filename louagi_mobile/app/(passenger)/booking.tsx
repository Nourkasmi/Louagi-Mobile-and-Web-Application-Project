// app/(passenger)/booking.tsx - Fixed Payment Navigation
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createBooking, createPaymentIntent, type Trip } from '../../src/services/api';

export default function PassengerBookingScreen() {
  const { tripId, tripData } = useLocalSearchParams<{
    tripId: string;
    tripData: string;
  }>();
  
  const router = useRouter();
  
  // Parse trip data
  const trip: Trip = tripData ? JSON.parse(tripData) : null;
  
  // State management
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate total amount
  const totalAmount = trip ? (trip.currentPrice / trip.capacity) * selectedSeats : 0;

  // Format time for display
  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'When full';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Today';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle seat selection
  const handleSeatChange = (change: number) => {
    const newSeats = selectedSeats + change;
    if (newSeats >= 1 && newSeats <= Math.min(trip.availableSeats, 4)) {
      setSelectedSeats(newSeats);
    }
  };

  // Handle booking creation and payment
  const handleBooking = async () => {
    if (!trip) {
      Alert.alert('Error', 'Trip information not available');
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create booking
      const bookingResponse = await createBooking({
        tripId: trip.id,
        seats: selectedSeats,
        specialRequests: specialRequests.trim() || undefined,
      });

      if (!bookingResponse.success || !bookingResponse.data) {
        Alert.alert('Booking Failed', bookingResponse.message || 'Failed to create booking');
        return;
      }

      const booking = bookingResponse.data;

      // Step 2: Create payment intent
      const paymentResponse = await createPaymentIntent(booking.id);

      if (!paymentResponse.success) {
        Alert.alert('Payment Failed', 'Failed to initialize payment');
        return;
      }

      // Step 3: Navigate to payment screen with client secret - FIXED PATH
      router.push({
        pathname: '/(passenger)/payment',
        params: {
          bookingId: booking.id,
          clientSecret: paymentResponse.clientSecret || paymentResponse.data?.clientSecret,
          amount: totalAmount.toString(),
          bookingReference: booking.bookingReference,
        }
      });

    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading if no trip data
  if (!trip) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading trip details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Book Your Trip</Text>
      </View>

      {/* Trip Summary Card */}
      <View style={styles.tripSummary}>
        <Text style={styles.routeText}>
          {trip.route.startStation.name} → {trip.route.endStation.name}
        </Text>
        <Text style={styles.routeDescription}>{trip.route.description}</Text>
        
        <View style={styles.tripDetails}>
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Departure</Text>
            <Text style={styles.timeValue}>{formatTime(trip.departureTime)}</Text>
            <Text style={styles.dateValue}>{formatDate(trip.departureTime)}</Text>
          </View>
          
          <View style={styles.durationInfo}>
            <Text style={styles.timeLabel}>Duration</Text>
            <Text style={styles.timeValue}>{trip.route.estimatedDuration} min</Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Arrival</Text>
            <Text style={styles.timeValue}>{formatTime(trip.estimatedArrivalTime)}</Text>
          </View>
        </View>

        <View style={styles.driverInfo}>
          <Text style={styles.driverLabel}>Driver: {trip.driver.user.username}</Text>
          <Text style={styles.driverRating}>⭐ {trip.driver.rating.toFixed(1)}</Text>
        </View>

        {/* Capacity Status */}
        <View style={styles.capacityStatus}>
          <View style={styles.capacityHeader}>
            <Text style={styles.capacityLabel}>Trip Capacity</Text>
            <Text style={styles.capacityCount}>
              {trip.capacity - trip.availableSeats}/{trip.capacity} booked
            </Text>
          </View>
          
          <View style={styles.capacityBar}>
            <View 
              style={[
                styles.capacityFill, 
                { 
                  width: `${((trip.capacity - trip.availableSeats) / trip.capacity) * 100}%`,
                  backgroundColor: trip.availableSeats <= 1 ? '#dc3545' : '#28a745'
                }
              ]} 
            />
          </View>
          
          <Text style={styles.availabilityText}>
            {trip.availableSeats} seat{trip.availableSeats !== 1 ? 's' : ''} remaining
          </Text>
        </View>
      </View>

      {/* Seat Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Seats</Text>
        <View style={styles.seatSelector}>
          <TouchableOpacity
            style={[styles.seatButton, selectedSeats === 1 && styles.seatButtonDisabled]}
            onPress={() => handleSeatChange(-1)}
            disabled={selectedSeats === 1}
          >
            <Text style={styles.seatButtonText}>-</Text>
          </TouchableOpacity>
          
          <View style={styles.seatDisplay}>
            <Text style={styles.seatCount}>{selectedSeats}</Text>
            <Text style={styles.seatLabel}>seat{selectedSeats > 1 ? 's' : ''}</Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.seatButton,
              selectedSeats >= Math.min(trip.availableSeats, 4) && styles.seatButtonDisabled
            ]}
            onPress={() => handleSeatChange(1)}
            disabled={selectedSeats >= Math.min(trip.availableSeats, 4)}
          >
            <Text style={styles.seatButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.availabilityText}>
          {trip.availableSeats} seats available • Max 4 seats per booking
        </Text>
      </View>

      {/* Special Requests */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Special Requests (Optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Any special requirements or notes..."
          value={specialRequests}
          onChangeText={setSpecialRequests}
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        <Text style={styles.characterCount}>
          {specialRequests.length}/500 characters
        </Text>
      </View>

      {/* Price Summary */}
      <View style={styles.priceSummary}>
        <Text style={styles.priceSummaryTitle}>Price Summary</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Price per seat</Text>
          <Text style={styles.priceValue}>
            ${(trip.currentPrice / trip.capacity).toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Seats × {selectedSeats}</Text>
          <Text style={styles.priceValue}>
            ${totalAmount.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.priceRowTotal}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Important Notes */}
      <View style={styles.notesSection}>
        <Text style={styles.notesTitle}>Important Notes:</Text>
        <Text style={styles.notesText}>• Payment will be processed after booking confirmation</Text>
        <Text style={styles.notesText}>• Cancellations must be made at least 1 hour before departure</Text>
        <Text style={styles.notesText}>• Trip may start automatically when capacity is full</Text>
        <Text style={styles.notesText}>• You'll receive booking confirmation via email</Text>
      </View>

      {/* Book Button */}
      <TouchableOpacity
        style={[styles.bookButton, loading && styles.bookButtonDisabled]}
        onPress={handleBooking}
        disabled={loading || trip.availableSeats === 0}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.bookButtonText}>
            {trip.availableSeats === 0 ? 'Trip Full' : `Book Trip - $${totalAmount.toFixed(2)}`}
          </Text>
        )}
      </TouchableOpacity>

      {/* Terms */}
      <Text style={styles.termsText}>
        By booking this trip, you agree to our terms and conditions. 
        Your booking will be confirmed after successful payment processing.
      </Text>
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
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tripSummary: {
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
  routeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeInfo: {
    flex: 1,
    alignItems: 'center',
  },
  durationInfo: {
    flex: 1,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#eee',
  },
  timeLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  driverInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 16,
  },
  driverLabel: {
    fontSize: 14,
    color: '#666',
  },
  driverRating: {
    fontSize: 14,
    color: '#666',
  },
  capacityStatus: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  capacityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  capacityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  capacityCount: {
    fontSize: 14,
    color: '#666',
  },
  capacityBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
  },
  capacityFill: {
    height: '100%',
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  seatSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  seatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seatButtonDisabled: {
    backgroundColor: '#ccc',
  },
  seatButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  seatDisplay: {
    marginHorizontal: 40,
    alignItems: 'center',
  },
  seatCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  seatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  priceSummary: {
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
  priceSummaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  priceRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  notesSection: {
    backgroundColor: '#fff3cd',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
    lineHeight: 18,
  },
  bookButton: {
    backgroundColor: '#0066cc',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginHorizontal: 16,
    marginBottom: 32,
    lineHeight: 18,
  },
});