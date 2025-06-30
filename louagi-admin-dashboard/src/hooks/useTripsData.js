// src/hooks/useTripsData.js
import { useState, useEffect, useCallback } from 'react';
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

    // ✅ ENHANCED: Centralized API request function with better error handling
    const apiRequest = useCallback(async (endpoint, options = {}) => {
        const token = localStorage.getItem('louagi_token');

        if (!token) {
            throw new Error('Authentication token not found. Please login again.');
        }

        // Build full URL
        const url = `${API_BASE_URL}${endpoint}`;

        const config = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(15000), // 15 second timeout
            ...options
        };

        console.log(`🔄 API Request: ${config.method} ${url}`);

        try {
            const response = await fetch(url, config);

            console.log(`📥 API Response: ${response.status} ${response.statusText}`);

            // Check if response is ok
            if (!response.ok) {
                // Try to get error message from response
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }

                // Handle specific error codes
                if (response.status === 401) {
                    localStorage.removeItem('louagi_token');
                    window.location.href = '/login';
                    throw new Error('Session expired. Please login again.');
                }

                throw new Error(errorMessage);
            }

            // Parse JSON response
            const data = await response.json();
            console.log(`📊 API Data received:`, {
                endpoint,
                dataSize: JSON.stringify(data).length,
                hasSuccess: 'success' in data,
                success: data.success
            });

            return data;
        } catch (error) {
            // Handle different types of errors
            if (error.name === 'AbortError') {
                console.error('❌ Request timeout:', endpoint);
                throw new Error('Request timed out. Please check your connection and try again.');
            }

            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                console.error('❌ Network error:', endpoint);
                throw new Error('Network error. Please check your internet connection and ensure the backend is running.');
            }

            console.error('❌ API Request failed:', error);
            throw error;
        }
    }, [API_BASE_URL]);

    // ✅ ENHANCED: Fetch trips with better error handling and retry logic
    const fetchTrips = useCallback(async (retryCount = 0) => {
        try {
            setLoading(true);
            setError(null);

            // Build query parameters
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.status) params.append('status', filters.status);
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
            console.error('❌ Trips fetch error:', err);

            // Retry logic for network errors
            if (retryCount < 2 && (
                err.message.includes('Network error') ||
                err.message.includes('timed out') ||
                err.message.includes('Failed to fetch')
            )) {
                console.log(`🔄 Retrying trips fetch (attempt ${retryCount + 1})...`);
                setTimeout(() => fetchTrips(retryCount + 1), 1000 * (retryCount + 1));
                return;
            }

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
        } finally {
            setLoading(false);
        }
    }, [filters, apiRequest]);

    // ✅ ENHANCED: Fetch trip statistics with fallback
    const fetchStats = useCallback(async () => {
        try {
            console.log('📊 Fetching trip stats...');

            const data = await apiRequest('/trips/stats');

            if (data.success && data.stats) {
                setStats({
                    totalTrips: data.stats.total || 0,
                    activeTrips: data.stats.active || 0,
                    completedTrips: data.stats.completed || 0,
                    totalPassengers: data.stats.totalPassengers || 0
                });
            } else {
                console.warn('⚠️ Stats endpoint returned unexpected format');
                // Calculate stats from current trips data as fallback
                setStats({
                    totalTrips: trips.length,
                    activeTrips: trips.filter(t => t.status === 'in_progress').length,
                    completedTrips: trips.filter(t => t.status === 'completed').length,
                    totalPassengers: trips.reduce((sum, t) => sum + (t.passengerCount || 0), 0)
                });
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch trip stats:', error.message);
            // Use calculated stats as fallback
            setStats({
                totalTrips: trips.length,
                activeTrips: trips.filter(t => t.status === 'in_progress').length,
                completedTrips: trips.filter(t => t.status === 'completed').length,
                totalPassengers: trips.reduce((sum, t) => sum + (t.passengerCount || 0), 0)
            });
        }
    }, [apiRequest, trips]);

    // ✅ ENHANCED: Update trip status with optimistic updates
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
                // Refresh stats
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

    // ✅ ENHANCED: Export trips with error handling
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

    // ✅ ENHANCED: Refresh data with loading state
    const refreshData = async () => {
        setRefreshing(true);
        try {
            await Promise.all([fetchTrips(), fetchStats()]);
            showToast('Data refreshed successfully', 'success');
        } catch (error) {
            console.error('Refresh error:', error);
            showToast('Failed to refresh data', 'error');
        } finally {
            setRefreshing(false);
        }
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    // View trip details (placeholder for modal)
    const viewTripDetails = (trip) => {
        console.log('Viewing trip details:', trip);
        // You can implement a modal here
        alert(`Trip Details:\nID: ${trip.id}\nRoute: ${trip.route?.description || 'Unknown'}\nStatus: ${trip.status}`);
    };

    // ✅ ENHANCED: Load initial data with better error handling
    useEffect(() => {
        const loadData = async () => {
            console.log('🚀 Starting initial data load...');
            console.log('🔗 API URL:', API_BASE_URL);
            console.log('🔐 Token exists:', !!localStorage.getItem('louagi_token'));

            try {
                // Quick network check
                if (!navigator.onLine) {
                    throw new Error('No internet connection detected');
                }

                // Try to fetch trips first
                await fetchTrips();
                console.log('✅ Trips loaded successfully');
            } catch (error) {
                console.error('❌ Initial trips fetch failed:', error.message);

                // Set specific error messages based on error type
                if (error.message.includes('Authentication') || error.message.includes('token')) {
                    setError('Authentication expired. Please login again.');
                } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
                    setError('Cannot connect to server. Please check if the backend is running.');
                } else if (error.message.includes('timeout')) {
                    setError('Server response timeout. Please try again.');
                } else {
                    setError(`Connection error: ${error.message}`);
                }

                setLoading(false);
            }

            // Try to fetch stats (non-critical)
            try {
                await fetchStats();
                console.log('✅ Stats loaded successfully');
            } catch (error) {
                console.warn('⚠️ Stats fetch failed, using fallback:', error.message);
                // This is non-critical, so we don't show error to user
            }
        };

        loadData();
    }, [fetchTrips, fetchStats, API_BASE_URL]);

    // ✅ NEW: Auto-retry on network reconnection
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
    }, [error, loading, refreshData]);

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