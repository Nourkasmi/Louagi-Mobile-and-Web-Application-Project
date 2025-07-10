// app/(passenger)/booking/components/BookingScreen.tsx - FIXED PARAMETER HANDLING
import React from 'react';
import { View, ScrollView, ActivityIndicator, Text, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useBookingFlow } from '../hooks/useBookingFlow';
import BookingHeader from './BookingHeader';
import BookingProgress from './BookingProgress';
import MockPaymentNotice from './MockPaymentNotice';
import TripSummaryCard from './TripSummaryCard';
import SeatSelector from './SeatSelector';
import SpecialRequestsInput from './SpecialRequestsInput';
import PriceSummary from './PriceSummary';
import StatusMessage from './StatusMessage';
import BookingActions from './BookingActions';
import BookingNotes from './BookingNotes';
import ErrorState from './ErrorState';

export default function BookingScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();

    // Debug: Log all received parameters
    console.log('🔍 BookingScreen received params:', params);

    // Extract parameters safely
    const tripId = Array.isArray(params.tripId) ? params.tripId[0] : params.tripId;
    const tripData = Array.isArray(params.tripData) ? params.tripData[0] : params.tripData;

    console.log('🔍 Extracted tripId:', tripId);
    console.log('🔍 Extracted tripData type:', typeof tripData);

    // Validate required parameters
    if (!tripId) {
        console.error('❌ No tripId provided to BookingScreen');
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Missing trip information</Text>
                <Text style={styles.errorSubtext}>No trip ID was provided</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>← Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Parse trip data safely
    let initialTrip = null;
    if (tripData) {
        try {
            initialTrip = JSON.parse(tripData as string);
            console.log('✅ Successfully parsed initial trip data');
        } catch (error) {
            console.error('❌ Failed to parse tripData:', error);
        }
    }

    const { state, actions } = useBookingFlow(tripId as string, initialTrip);

    // Loading state
    if (state.loading && !state.trip) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066cc" />
                <Text style={styles.loadingText}>Loading trip details...</Text>
                <Text style={styles.debugText}>Trip ID: {tripId}</Text>
            </View>
        );
    }

    // Error state
    if (state.error && !state.trip) {
        return (
            <ErrorState
                error={state.error}
                onRetry={actions.retryLoading}
                onGoBack={actions.goBack}
            />
        );
    }

    return (
        <View style={styles.container}>
            <BookingHeader />
            <BookingProgress progress={state.progress} step={state.step} />

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={state.refreshing}
                        onRefresh={actions.refreshTripData}
                        colors={['#0066cc']}
                        title="Pull to refresh trip data"
                    />
                }
            >
                <MockPaymentNotice />
                <TripSummaryCard />
                <SeatSelector />
                <SpecialRequestsInput />
                <PriceSummary />
                <StatusMessage />
                <BookingActions />
                <BookingNotes />
            </ScrollView>
        </View>
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
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    debugText: {
        marginTop: 8,
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
    scrollContainer: {
        flex: 1,
    },
    errorText: {
        fontSize: 18,
        color: '#f44336',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    backButton: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});