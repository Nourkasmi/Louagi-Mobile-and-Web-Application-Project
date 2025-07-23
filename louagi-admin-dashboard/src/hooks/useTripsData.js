import { useState, useEffect, useCallback, useRef } from 'react';
import { showToast } from '../utils/toast';

export const useTripsData = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const [stats, setStats] = useState({
        totalTrips: 0,
        activeTrips: 0,
        completedTrips: 0,
        totalPassengers: 0
    });

    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        currentPage: 1
    });

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        page: 1,
        limit: 10
    });

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // ✅ FIX: Use ref to prevent infinite loops
    const isInitialLoad = useRef(true);
    const abortControllerRef = useRef(null);

    // ✅ FIX: Memoized API request function
    const apiRequest = useCallback(async (endpoint, options = {}) => {
        const token = localStorage.getItem('louagi_token');

        if (!token) {
            throw new Error('Authentication token not found. Please login again.');
        }

        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller
        abortControllerRef.current = new AbortController();

        const config = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            signal: abortControllerRef.current.signal,
            ...options
        };

        const url = `${API_BASE_URL}${endpoint}`;
        console.log(`🔄 API Request: ${config.method} ${url}`);

        try {
            const response = await fetch(url, config);
            console.log(`📥 API Response: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }

                if (response.status === 401) {
                    localStorage.removeItem('louagi_token');
                    window.location.href = '/login';
                    throw new Error('Session expired. Please login again.');
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`📊 API Data received:`, {
                endpoint,
                dataSize: JSON.stringify(data).length,
                hasSuccess: 'success' in data,
                success: data.success
            });

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('🚫 Request cancelled');
                throw new Error('Request cancelled');
            }

            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.error('❌ Network error:', endpoint);
                throw new Error('Network error. Please check your internet connection and ensure the backend is running.');
            }

            console.error('❌ API Request failed:', error);
            throw error;
        }
    }, [API_BASE_URL]);

    // ✅ FIX: Stable fetchTrips function with better dependency management
    const fetchTrips = useCallback(async () => {
        try {
            console.log('📡 Fetching trips with filters:', filters);
            setError(null);

            // Build query parameters
            const params = new URLSearchParams();
            if (filters.search?.trim()) params.append('search', filters.search.trim());
            if (filters.status?.trim()) params.append('status', filters.status.trim());
            params.append('page', filters.page.toString());
            params.append('limit', filters.limit.toString());

            const endpoint = `/trips?${params.toString()}`;
            const data = await apiRequest(endpoint);

            // Validate response structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid response format from server');
            }

            if (data.success === false) {
                throw new Error(data.message || 'Server returned an error');
            }

            // Handle different response structures
            const tripsData = data.trips || data.data || [];
            const totalCount = data.total || data.totalCount || tripsData.length;

            // Validate trips data
            if (!Array.isArray(tripsData)) {
                throw new Error('Invalid trips data format');
            }

            setTrips(tripsData);
            setPagination({
                total: totalCount,
                totalPages: data.totalPages || Math.ceil(totalCount / filters.limit),
                currentPage: data.currentPage || filters.page
            });

            console.log(`✅ Trips loaded successfully: ${tripsData.length} trips`);

        } catch (err) {
            if (err.message === 'Request cancelled') {
                return; // Don't update state for cancelled requests
            }

            console.error('❌ Trips fetch error:', err);
            setError(err.message || 'Failed to load trips');
            setTrips([]);
            setPagination({ total: 0, totalPages: 0, currentPage: 1 });

            // Show user-friendly error messages
            if (err.message.includes('Authentication') || err.message.includes('token')) {
                setError('Please login again to continue.');
            } else if (err.message.includes('Network') || err.message.includes('connection')) {
                setError('Connection error. Please check your internet and try again.');
            } else if (err.message.includes('Server returned an error')) {
                setError('Server error. Please try again later.');
            }
        }
    }, [filters.search, filters.status, filters.page, filters.limit, apiRequest]);

    // ✅ FIX: Enhanced stats fetching with real total count
    const fetchStats = useCallback(async () => {
        try {
            console.log('📊 Fetching trip stats...');

            // ✅ NEW: Fetch stats from dedicated endpoint first
            let statsFromEndpoint = null;
            try {
                const statsData = await apiRequest('/trips/stats');
                if (statsData.success && statsData.stats) {
                    statsFromEndpoint = statsData.stats;
                    console.log('✅ Got stats from dedicated endpoint:', statsFromEndpoint);
                }
            } catch (error) {
                console.warn('⚠️ Stats endpoint failed, will calculate from pagination data');
            }

            // ✅ NEW: Get total count from a separate request to get accurate total
            let totalTripsCount = pagination.total || 0;
            try {
                const totalData = await apiRequest('/trips?limit=1&page=1');
                if (totalData.success) {
                    totalTripsCount = totalData.total || totalData.totalCount || pagination.total || 0;
                    console.log('✅ Got total trips count:', totalTripsCount);
                }
            } catch (error) {
                console.warn('⚠️ Could not fetch total trips count, using pagination total');
            }

            // ✅ FIX: Calculate stats properly
            const calculatedStats = {
                // Use real total from backend, not just current page
                totalTrips: statsFromEndpoint?.total || totalTripsCount,

                // Calculate from current trips data or use backend stats
                activeTrips: statsFromEndpoint?.active ||
                    trips.filter(t => t.status === 'in_progress' || t.status === 'scheduled').length,

                completedTrips: statsFromEndpoint?.completed ||
                    trips.filter(t => t.status === 'completed').length,

                totalPassengers: statsFromEndpoint?.totalPassengers ||
                    trips.reduce((sum, t) => sum + (t.passengerCount || t.seatsBooked || 0), 0)
            };

            setStats(calculatedStats);
            console.log('✅ Updated stats:', calculatedStats);

        } catch (error) {
            if (error.message === 'Request cancelled') {
                return; // Don't update state for cancelled requests
            }

            console.warn('⚠️ Could not fetch trip stats:', error.message);

            // ✅ FIX: Use pagination total for accurate count
            const fallbackStats = {
                totalTrips: pagination.total || trips.length,
                activeTrips: trips.filter(t => t.status === 'in_progress' || t.status === 'scheduled').length,
                completedTrips: trips.filter(t => t.status === 'completed').length,
                totalPassengers: trips.reduce((sum, t) => sum + (t.passengerCount || t.seatsBooked || 0), 0)
            };

            setStats(fallbackStats);
            console.log('📊 Using fallback stats:', fallbackStats);
        }
    }, [trips, pagination.total, apiRequest]);

    // ✅ FIX: Update trip status with optimistic updates
    const updateTripStatus = async (tripId, newStatus) => {
        try {
            // Optimistic update
            const updatedTrips = trips.map(trip =>
                trip.id === tripId ? { ...trip, status: newStatus } : trip
            );
            setTrips(updatedTrips);

            const data = await apiRequest(`/trips/${tripId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });

            if (data.success) {
                // Refresh stats after successful update
                await fetchStats();
                showToast(`Trip status updated to ${newStatus}`, 'success');
                return { success: true };
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        } catch (err) {
            console.error('Error updating trip status:', err);
            // Revert optimistic update
            await fetchTrips();
            showToast('Error updating trip status: ' + err.message, 'error');
            return { success: false, error: err.message };
        }
    };

    // ✅ FIX: Export trips with error handling
    const exportTrips = () => {
        try {
            if (!trips.length) {
                showToast('No trips to export', 'error');
                return;
            }

            const csvContent = [
                ['Trip ID', 'Route', 'Driver', 'Status', 'Departure', 'Seats', 'Price'].join(','),
                ...trips.map(trip => [
                    trip.id?.slice(0, 8) || 'Unknown',
                    trip.route?.description || 'Unknown Route',
                    trip.driver?.user?.username || 'Unknown Driver',
                    trip.status || 'Unknown',
                    trip.departureTime ? new Date(trip.departureTime).toLocaleString() : 'N/A',
                    `${trip.availableSeats || 0}/${trip.capacity || 0}`,
                    trip.currentPrice ? `$${trip.currentPrice}` : 'N/A'
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trips-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            showToast('Trips exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to export trips', 'error');
        }
    };

    // ✅ FIX: Refresh data with loading state
    const refreshData = async () => {
        setRefreshing(true);
        try {
            await fetchTrips(); // This will also trigger stats update
            showToast('Data refreshed successfully', 'success');
        } catch (error) {
            console.error('Refresh error:', error);
            showToast('Failed to refresh data', 'error');
        } finally {
            setRefreshing(false);
        }
    };

    // Handle page change
    const handlePageChange = useCallback((newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    }, []);

    // View trip details (placeholder for modal)
    const viewTripDetails = useCallback((trip) => {
        console.log('Viewing trip details:', trip);
        alert(`Trip Details:\nID: ${trip.id}\nRoute: ${trip.route?.description || 'Unknown'}\nStatus: ${trip.status}`);
    }, []);

    // ✅ FIX: Initial data loading effect - runs only once
    useEffect(() => {
        if (isInitialLoad.current) {
            console.log('🚀 Starting initial data load...');
            console.log('🔗 API URL:', API_BASE_URL);
            console.log('🔐 Token exists:', !!localStorage.getItem('louagi_token'));

            isInitialLoad.current = false;
            setLoading(true);

            const loadInitialData = async () => {
                try {
                    // Quick network check
                    if (!navigator.onLine) {
                        throw new Error('No internet connection detected');
                    }

                    await fetchTrips();
                    console.log('✅ Initial trips loaded successfully');
                } catch (error) {
                    console.error('❌ Initial trips fetch failed:', error.message);
                    setError(error.message);
                } finally {
                    setLoading(false);
                }
            };

            loadInitialData();
        }

        // Cleanup function
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []); // ✅ FIX: Empty dependency array - only run once

    // ✅ FIX: Filter change effect - runs when filters change (but not on initial load)
    useEffect(() => {
        if (!isInitialLoad.current && !loading) {
            console.log('🔄 Filters changed, refetching trips:', filters);

            const refetchWithDelay = setTimeout(() => {
                fetchTrips();
            }, 100); // Small delay to prevent rapid consecutive calls

            return () => clearTimeout(refetchWithDelay);
        }
    }, [filters.search, filters.status, filters.page, filters.limit, fetchTrips, loading]);

    // ✅ FIX: Stats update effect - runs when trips or pagination changes
    useEffect(() => {
        if (!isInitialLoad.current && (trips.length >= 0 || pagination.total > 0)) {
            console.log('📊 Trips/pagination updated, refreshing stats');

            const updateStatsWithDelay = setTimeout(() => {
                fetchStats();
            }, 200); // Small delay to prevent rapid consecutive calls

            return () => clearTimeout(updateStatsWithDelay);
        }
    }, [trips.length, pagination.total, fetchStats]);

    // ✅ FIX: Network reconnection handler
    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Network reconnected, retrying data fetch...');
            if (error && !loading) {
                refreshData();
            }
        };

        const handleOffline = () => {
            console.log('📱 Network disconnected');
            setError('No internet connection. Please check your network.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [error, loading]); // ✅ FIX: Stable dependencies

    return {
        // Data
        trips,
        stats,
        pagination,

        // Loading states
        loading,
        refreshing,
        error,

        // Filters
        filters,
        setFilters,

        // Actions
        updateTripStatus,
        exportTrips,
        refreshData,
        handlePageChange,
        viewTripDetails,

        // Computed
        hasFilters: Boolean(filters.search || filters.status),

        // Debug info
        apiUrl: API_BASE_URL,
        connectionStatus: error ? 'error' : loading ? 'connecting' : 'connected'
    };
};