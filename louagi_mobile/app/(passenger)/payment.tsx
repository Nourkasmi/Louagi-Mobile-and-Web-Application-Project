// app/(passenger)/payment.tsx - UNIFIED Payment Screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getBookingById, type Booking } from '../../src/services/api';

// Mock payment service for demonstration
const MOCK_CARDS = [
  {
    id: 'visa_4242',
    brand: 'Visa',
    last4: '4242',
    success: true,
    description: 'Always succeeds',
    delay: 2000,
  },
  {
    id: 'mastercard_5555',
    brand: 'MasterCard',
    last4: '5555',
    success: true,
    description: 'Always succeeds',
    delay: 1800,
  },
  {
    id: 'amex_1234',
    brand: 'Amex',
    last4: '1234',
    success: false,
    description: 'Always declines',
    delay: 2500,
    error: 'Card declined - Insufficient funds',
  },
  {
    id: 'visa_0000',
    brand: 'Visa',
    last4: '0000',
    success: false,
    description: 'Insufficient funds',
    delay: 2200,
    error: 'Insufficient funds',
  },
];

export default function UnifiedPaymentScreen() {
  const {
    bookingId,
    amount,
    bookingReference,
    tripData,
  } = useLocalSearchParams<{
    bookingId: string;
    amount: string;
    bookingReference: string;
    tripData?: string;
  }>();

  const router = useRouter();

  // State management
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'processing' | 'success' | 'failed'>('select');
  const [selectedCard, setSelectedCard] = useState<typeof MOCK_CARDS[0] | null>(null);

  // Parse trip data if available
  const tripInfo = tripData ? JSON.parse(tripData) : null;

  // Fetch booking details
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        if (bookingId) {
          const response = await getBookingById(bookingId);
          if (response.success && response.data) {
            setBooking(response.data);
          }
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId]);

  // Get display data
  const displayData = booking || tripInfo;
  const trip = displayData?.trip || tripInfo;

  // Process payment with selected card
  const processPayment = async (card: typeof MOCK_CARDS[0]) => {
    try {
      setSelectedCard(card);
      setStep('processing');
      setProcessing(true);

      console.log(`🎭 Processing ${card.brand} •••• ${card.last4}...`);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, card.delay));

      if (card.success) {
        setStep('success');
        console.log('✅ Payment successful');
      } else {
        setStep('failed');
        console.log('❌ Payment failed:', card.error);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setStep('failed');
    } finally {
      setProcessing(false);
    }
  };

  // Show test card info
  const showTestCardInfo = () => {
    const cardInfo = MOCK_CARDS.map(card =>
      `${card.success ? '✅' : '❌'} ${card.brand} •••• ${card.last4} - ${card.description}`
    ).join('\n');

    Alert.alert(
      '💳 Available Test Cards',
      `Use these mock cards for testing:\n\n${cardInfo}\n\n🎭 No real money will be charged!`,
      [{ text: 'Got it!', style: 'default' }]
    );
  };

  // Navigation handlers
  const handleComplete = () => {
    if (step === 'success') {
      router.replace({
        pathname: '/(passenger)/bookings/[id]',
        params: {
          id: bookingId,
          bookingData: booking ? JSON.stringify(booking) : undefined
        }
      });
    } else {
      setStep('select');
      setSelectedCard(null);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Payment?',
      'You can complete payment later from "My Bookings".',
      [
        { text: 'Complete Now', style: 'default' },
        {
          text: 'Skip for Now',
          style: 'cancel',
          onPress: () => router.replace({
            pathname: '/(passenger)/bookings/[id]',
            params: {
              id: bookingId,
              bookingData: booking ? JSON.stringify(booking) : undefined
            }
          })
        }
      ]
    );
  };

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <StatusBar barStyle="light-content" backgroundColor="#ff9800" />

      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Complete Payment</Text>

        <View style={styles.mockIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.mockText}>Mock</Text>
        </View>
      </View>
    </View>
  );

  // Render booking summary
  const renderBookingSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Payment Summary</Text>

      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Booking Reference</Text>
        <Text style={styles.summaryValue}>#{bookingReference}</Text>
      </View>

      {trip && (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Route</Text>
            <Text style={styles.summaryValue}>
              {trip.route?.startStation?.name || 'Departure'} → {trip.route?.endStation?.name || 'Destination'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Departure</Text>
            <Text style={styles.summaryValue}>
              {trip.departureTime ?
                new Date(trip.departureTime).toLocaleString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }) : 'When trip is full'
              }
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Seats</Text>
            <Text style={styles.summaryValue}>{booking?.seats || '1'}</Text>
          </View>
        </>
      )}

      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>${amount}</Text>
      </View>
    </View>
  );

  // Render card selection
  const renderCardSelection = () => (
    <View style={styles.paymentSection}>
      <Text style={styles.sectionTitle}>Choose Payment Method</Text>

      {MOCK_CARDS.map((card) => (
        <TouchableOpacity
          key={card.id}
          style={[
            styles.cardOption,
            { borderColor: card.success ? '#28a745' : '#dc3545' }
          ]}
          onPress={() => processPayment(card)}
          disabled={processing}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardLeft}>
              <MaterialIcons
                name="credit-card"
                size={24}
                color={card.success ? '#28a745' : '#dc3545'}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardBrand}>{card.brand}</Text>
                <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>
            </View>
            <Text style={[
              styles.cardStatus,
              { color: card.success ? '#28a745' : '#dc3545' }
            ]}>
              {card.success ? '✅ Success' : '❌ Fails'}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.infoButton} onPress={showTestCardInfo}>
        <MaterialIcons name="info" size={20} color="#ff9800" />
        <Text style={styles.infoButtonText}>View Test Card Details</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Complete Payment Later</Text>
      </TouchableOpacity>
    </View>
  );

  // Render processing state
  const renderProcessing = () => (
    <View style={styles.centeredContent}>
      <ActivityIndicator size="large" color="#ff9800" />
      <Text style={styles.processingTitle}>Processing Payment</Text>
      <Text style={styles.processingText}>
        Processing {selectedCard?.brand} •••• {selectedCard?.last4}
      </Text>
      <Text style={styles.processingSubtext}>Please wait...</Text>
    </View>
  );

  // Render success state
  const renderSuccess = () => (
    <View style={styles.centeredContent}>
      <View style={styles.successIcon}>
        <MaterialIcons name="check-circle" size={64} color="#28a745" />
      </View>
      <Text style={styles.successTitle}>🎭 Payment Successful!</Text>
      <Text style={styles.successText}>
        Your mock payment has been processed successfully!
      </Text>
      <Text style={styles.successDetails}>
        Card: {selectedCard?.brand} •••• {selectedCard?.last4}
      </Text>
      <Text style={styles.successAmount}>Amount: ${amount}</Text>
      <Text style={styles.mockNotice}>
        ⚠️ This was a test payment - no real money was charged!
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
        <MaterialIcons name="visibility" size={20} color="white" />
        <Text style={styles.primaryButtonText}>View Booking</Text>
      </TouchableOpacity>
    </View>
  );

  // Render failed state
  const renderFailed = () => (
    <View style={styles.centeredContent}>
      <View style={styles.errorIcon}>
        <MaterialIcons name="error" size={64} color="#dc3545" />
      </View>
      <Text style={styles.errorTitle}>Payment Failed</Text>
      <Text style={styles.errorText}>
        {selectedCard?.error || 'Payment could not be processed'}
      </Text>
      <Text style={styles.errorDetails}>
        Card: {selectedCard?.brand} •••• {selectedCard?.last4}
      </Text>
      <Text style={styles.mockNotice}>
        🎭 This is a test failure - try a different test card
      </Text>

      <TouchableOpacity style={styles.retryButton} onPress={handleComplete}>
        <MaterialIcons name="refresh" size={20} color="white" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centeredContent}>
          <ActivityIndicator size="large" color="#ff9800" />
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (!booking && !tripInfo) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centeredContent}>
          <MaterialIcons name="error-outline" size={64} color="#dc3545" />
          <Text style={styles.errorText}>Booking information not available</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mock payment notice */}
        <View style={styles.mockNoticeCard}>
          <MaterialIcons name="info" size={20} color="#ff9800" />
          <Text style={styles.mockNoticeText}>
            🎭 Mock Payment Mode: No real money will be charged during testing!
          </Text>
        </View>

        {/* Booking summary */}
        {renderBookingSummary()}

        {/* Step-specific content */}
        {step === 'select' && renderCardSelection()}
        {step === 'processing' && renderProcessing()}
        {step === 'success' && renderSuccess()}
        {step === 'failed' && renderFailed()}

        {/* Additional info */}
        {step === 'select' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🎭 Test Environment Info:</Text>
            <Text style={styles.infoText}>• No real payment processing</Text>
            <Text style={styles.infoText}>• All transactions are simulated</Text>
            <Text style={styles.infoText}>• Use test cards provided above</Text>
            <Text style={styles.infoText}>• Trip starts when capacity is full</Text>
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

  // Header
  header: {
    backgroundColor: '#ff9800',
    paddingBottom: 20,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },

  backButton: {
    padding: 8,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },

  mockIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    marginRight: 4,
  },

  mockText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
  },

  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    minHeight: 400,
  },

  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },

  // Mock notice
  mockNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },

  mockNoticeText: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },

  // Summary card
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
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
    flex: 1,
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'right',
    flex: 2,
  },

  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ff9800',
  },

  // Payment section
  paymentSection: {
    margin: 16,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },

  // Card options
  cardOption: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  cardInfo: {
    marginLeft: 12,
  },

  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },

  cardNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },

  cardDescription: {
    fontSize: 12,
    color: '#888',
  },

  cardStatus: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Buttons
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ff9800',
  },

  infoButtonText: {
    color: '#856404',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },

  skipButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff9800',
  },

  skipButtonText: {
    color: '#ff9800',
    fontSize: 16,
    fontWeight: '600',
  },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff9800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },

  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },

  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Processing state
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },

  processingText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },

  processingSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },

  // Success state
  successIcon: {
    marginBottom: 20,
  },

  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#28a745',
    marginBottom: 12,
    textAlign: 'center',
  },

  successText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },

  successDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },

  successAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 16,
  },

  // Error state
  errorIcon: {
    marginBottom: 20,
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
  },

  errorText: {
    fontSize: 16,
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 22,
  },

  errorDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },

  mockNotice: {
    fontSize: 12,
    color: '#ff9800',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 6,
  },

  // Info card
  infoCard: {
    backgroundColor: '#fff3cd',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 12,
  },

  infoText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 4,
  },
});