// app/(passenger)/booking/hooks/useTripData.ts - FIXED TO HANDLE UNDEFINED TRIPID
import { useState, useEffect, useCallback } from 'react';
import { getTripById, type Trip } from '../../../../src/services/api';

export function useTripData(tripId: string | undefined, initialTrip?: Trip) {
    const [trip, setTrip] = useState<Trip | null>(initialTrip || null);
    const [loading, setLoading] = useState(!initialTrip);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTrip = useCallback(async (isRefresh = false) => {
        // Check if tripId is valid before making API call
        if (!tripId) {
            console.error('❌ Cannot fetch trip: tripId is undefined');
            setError('Trip ID is missing');
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            console.log(`🔄 Fetching trip ${tripId}...`);
            const response = await getTripById(tripId);

            if (response.success && response.data) {
                console.log('✅ Trip fetched successfully:', response.data);
                setTrip(response.data);
                setError(null);
            } else {
                console.error('❌ Trip not found:', response.message);
                setError(response.message || 'Trip not found');
            }
        } catch (err: any) {
            console.error('❌ Trip fetch error:', err);
            setError(err.message || 'Failed to load trip');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tripId]);

    // Only fetch if we have a valid tripId
    useEffect(() => {
        if (!initialTrip && tripId) {
            fetchTrip(false);
        } else if (!tripId) {
            setError('Trip ID is missing');
            setLoading(false);
        }
    }, [fetchTrip, initialTrip, tripId]);

    // Auto-refresh only if we have a valid tripId and trip
    useEffect(() => {
        if (!trip || !tripId) return;

        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing trip data...');
            fetchTrip(true);
        }, 30000);

        return () => {
            console.log('🛑 Stopping auto-refresh');
            clearInterval(interval);
        };
    }, [trip, fetchTrip, tripId]);

    const refreshTrip = useCallback(() => {
        if (!tripId) {
            console.error('❌ Cannot refresh: tripId is undefined');
            return;
        }
        console.log('🔄 Manual trip refresh triggered');
        fetchTrip(true);
    }, [fetchTrip, tripId]);

    const retryLoad = useCallback(() => {
        if (!tripId) {
            console.error('❌ Cannot retry: tripId is undefined');
            return;
        }
        console.log('🔄 Retrying trip load');
        fetchTrip(false);
    }, [fetchTrip, tripId]);

    return {
        trip,
        loading,
        refreshing,
        error,
        refreshTrip,
        retryLoad,
    };
}