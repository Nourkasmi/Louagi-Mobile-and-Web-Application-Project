//  app/(passenger)/booking/hooks/useTripData.ts 

import { useState, useEffect, useCallback } from 'react';
import { getTripById, type Trip } from '../../../../src/services/api';

export function useTripData(tripId: string | undefined, initialTrip?: Trip) {
    const [trip, setTrip] = useState<Trip | null>(initialTrip || null);
    const [loading, setLoading] = useState(!initialTrip);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTrip = useCallback(async (isRefresh = false) => {
        // 🔧 FIXED: Better validation
        if (!tripId || tripId === 'undefined' || tripId === 'null') {
            console.error('❌ Cannot fetch trip: tripId is invalid:', tripId);
            setError('Trip ID is missing or invalid');
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
                console.log('✅ Trip fetched successfully:', {
                    id: response.data.id,
                    route: response.data.route?.description || 'Unknown route',
                    capacity: response.data.capacity,
                    availableSeats: response.data.availableSeats
                });
                setTrip(response.data);
                setError(null);
            } else {
                console.error('❌ Trip not found:', response.message);
                setError(response.message || `Trip not found (ID: ${tripId})`);
                setTrip(null);
            }
        } catch (err: any) {
            console.error('❌ Trip fetch error:', err);
            setError(err.message || 'Failed to load trip');
            setTrip(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [tripId]);

    // 🔧 FIXED: Only fetch if we have a valid tripId and no initial trip
    useEffect(() => {
        if (!initialTrip && tripId && tripId !== 'undefined' && tripId !== 'null') {
            fetchTrip(false);
        } else if (!tripId || tripId === 'undefined' || tripId === 'null') {
            setError('Trip ID is missing');
            setLoading(false);
        } else if (initialTrip) {
            console.log('✅ Using initial trip data:', initialTrip.id);
            setTrip(initialTrip);
            setLoading(false);
            setError(null);
        }
    }, [fetchTrip, initialTrip, tripId]);

    // 🔧 FIXED: Auto-refresh only if we have a valid tripId and trip
    useEffect(() => {
        if (!trip || !tripId || tripId === 'undefined' || tripId === 'null') return;

        console.log('🔄 Setting up auto-refresh for trip:', tripId);
        const interval = setInterval(() => {
            console.log('🔄 Auto-refreshing trip data...');
            fetchTrip(true);
        }, 30000);

        return () => {
            console.log('🛑 Stopping auto-refresh for trip:', tripId);
            clearInterval(interval);
        };
    }, [trip, fetchTrip, tripId]);

    const refreshTrip = useCallback(() => {
        if (!tripId || tripId === 'undefined' || tripId === 'null') {
            console.error('❌ Cannot refresh: tripId is invalid:', tripId);
            setError('Cannot refresh: Trip ID is invalid');
            return;
        }
        console.log('🔄 Manual trip refresh triggered for:', tripId);
        fetchTrip(true);
    }, [fetchTrip, tripId]);

    const retryLoad = useCallback(() => {
        if (!tripId || tripId === 'undefined' || tripId === 'null') {
            console.error('❌ Cannot retry: tripId is invalid:', tripId);
            setError('Cannot retry: Trip ID is invalid');
            return;
        }
        console.log('🔄 Retrying trip load for:', tripId);
        setError(null);
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