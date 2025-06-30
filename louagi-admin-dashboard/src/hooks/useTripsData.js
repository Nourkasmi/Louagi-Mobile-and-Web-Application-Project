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

    // Fetch trips data
    const fetchTrips = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Build query parameters
            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.status) params.append('status', filters.status);
            params.append('page', filters.page.toString());
            params.append('limit', filters.limit.toString());

            console.log('🔄 Fetching trips with params:', params.toString());

            const response = await fetch(`${API_BASE_URL}/trips?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Response status:', response.status);

            const data = await response.json();
            console.log('📊 Trips data received:', data);

            if (!response.ok) {
                const errorMessage = data.message || data.error || `HTTP ${response.status}`;
                throw new Error(errorMessage);
            }

            if (data.success) {
                setTrips(data.trips || data.data || []);
                setPagination({
                    total: data.total || data.trips?.length || 0,
                    totalPages: data.totalPages || Math.ceil((data.total || 0) / filters.limit),
                    currentPage: data.currentPage || filters.page
                });
            } else {
                const errorMessage = data.message || data.error || 'Failed to fetch trips data';
                throw new Error(errorMessage);
            }

        } catch (err) {
            console.error('❌ Trips fetch error:', err);
            setError(err.message || 'Failed to load trips');
            setTrips([]);
            setPagination({ total: 0, totalPages: 0, currentPage: 1 });
        } finally {
            setLoading(false);
        }
    }, [filters, API_BASE_URL]);

    // Fetch trip statistics
    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('louagi_token');

            console.log('📊 Fetching trip stats...');

            const response = await fetch(`${API_BASE_URL}/trips/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 Stats response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('📊 Stats data:', data);

                if (data.success && data.stats) {
                    setStats({
                        totalTrips: data.stats.total || 0,
                        activeTrips: data.stats.active || 0,
                        completedTrips: data.stats.completed || 0,
                        totalPassengers: data.stats.totalPassengers || 0
                    });
                } else {
                    console.warn('⚠️ Stats endpoint returned unexpected format:', data);
                    // Calculate stats from current trips data
                    setStats({
                        totalTrips: trips.length,
                        activeTrips: trips.filter(t => t.status === 'in_progress').length,
                        completedTrips: trips.filter(t => t.status === 'completed').length,
                        totalPassengers: trips.reduce((sum, t) => sum + (t.passengerCount || 0), 0)
                    });
                }
            } else {
                console.warn('⚠️ Stats endpoint failed:', response.status);
                // Calculate from current data
                setStats({
                    totalTrips: trips.length,
                    activeTrips: trips.filter(t => t.status === 'in_progress').length,
                    completedTrips: trips.filter(t => t.status === 'completed').length,
                    totalPassengers: trips.reduce((sum, t) => sum + (t.passengerCount || 0), 0)
                });
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch trip stats:', error.message);
            // Set calculated stats if stats endpoint doesn't exist
            setStats({
                totalTrips: trips.length,
                activeTrips: trips.filter(t => t.status === 'in_progress').length,
                completedTrips: trips.filter(t => t.status === 'completed').length,
                totalPassengers: trips.reduce((sum, t) => sum + (t.passengerCount || 0), 0)
            });
        }
    }, [API_BASE_URL, trips]);

    // Update trip status
    const updateTripStatus = async (tripId, newStatus) => {
        try {
            const token = localStorage.getItem('louagi_token');
            const response = await fetch(`${API_BASE_URL}/trips/${tripId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (data.success) {
                // Update local state
                setTrips(trips.map(trip =>
                    trip.id === tripId ? { ...trip, status: newStatus } : trip
                ));

                // Refresh stats
                fetchStats();
                showToast(`Trip status updated to ${newStatus}`, 'success');
                return { success: true };
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        } catch (err) {
            console.error('Error updating trip status:', err);
            showToast('Error updating trip status: ' + err.message, 'error');
            return { success: false, error: err.message };
        }
    };

    // Export trips to CSV
    const exportTrips = () => {
        try {
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

    // Refresh data
    const refreshData = async () => {
        setRefreshing(true);
        await Promise.all([fetchTrips(), fetchStats()]);
        setRefreshing(false);
        showToast('Data refreshed successfully', 'success');
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

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                await fetchTrips();
            } catch (error) {
                console.warn('Initial trips fetch failed, will show empty state');
            }

            try {
                await fetchStats();
            } catch (error) {
                console.warn('Stats fetch failed, will show default stats');
            }
        };

        loadData();
    }, [fetchTrips, fetchStats]);

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
        hasFilters: Boolean(filters.search || filters.status)
    };
};