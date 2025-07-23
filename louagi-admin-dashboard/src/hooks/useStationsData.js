import { useState, useEffect, useCallback, useRef } from 'react';

export const useStationsData = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveLoading, setSaveLoading] = useState(false);

    // Simplified filters - only search now
    const [filters, setFilters] = useState({
        search: '',
        page: 1,
        limit: 10
    });

    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        currentPage: 1
    });

    const [stats, setStats] = useState({
        totalStations: 0,
        activeStations: 0,
        totalCapacity: 0,
        averageCapacity: 0
    });

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Use ref to prevent infinite loops
    const isInitialLoad = useRef(true);
    const abortControllerRef = useRef(null);

    // Fetch stations with enhanced data
    const fetchStations = useCallback(async () => {
        try {
            setError(null);

            // Don't show loading on subsequent searches
            if (isInitialLoad.current) {
                setLoading(true);
            }

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Cancel previous request if still pending
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            // Build query parameters - only search now
            const params = new URLSearchParams();
            if (filters.search?.trim()) {
                params.append('search', filters.search.trim());
            }
            params.append('page', filters.page.toString());
            params.append('limit', filters.limit.toString());

            console.log('🔄 Fetching stations with params:', params.toString());

            const stationsResponse = await fetch(`${API_BASE_URL}/stations?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: abortControllerRef.current.signal
            });

            if (!stationsResponse.ok) {
                throw new Error(`HTTP error! status: ${stationsResponse.status}`);
            }

            const stationsData = await stationsResponse.json();

            if (stationsData.success) {
                // Enhance station data with additional metrics
                const enhancedStations = stationsData.stations.map(station => ({
                    ...station,
                    currentQueues: 0, // Simplified - no complex queue calculations
                    activeTrips: 0,   // Simplified - no complex trip calculations
                    utilizationRate: 0, // Simplified
                    lastActivity: station.updatedAt,
                    amenitiesList: station.amenities ? Object.keys(station.amenities) : []
                }));

                setStations(enhancedStations);
                setPagination({
                    total: stationsData.total || enhancedStations.length,
                    totalPages: stationsData.totalPages || 1,
                    currentPage: stationsData.currentPage || 1
                });

                console.log('✅ Stations loaded successfully:', enhancedStations.length);
            } else {
                throw new Error('Failed to fetch stations data');
            }

        } catch (err) {
            // Don't show error for aborted requests
            if (err.name === 'AbortError') {
                console.log('🚫 Request cancelled');
                return;
            }

            console.error('❌ Stations fetch error:', err);
            setError(err.message || 'Failed to load stations');

            if (err.message.includes('401') || err.message.includes('token')) {
                setError('Authentication failed. Please login again.');
            } else if (!navigator.onLine) {
                setError('No internet connection. Please check your network.');
            } else {
                setError('Failed to load stations. Please ensure the backend is running.');
            }
        } finally {
            setLoading(false);
        }
    }, [filters.search, filters.page, filters.limit, API_BASE_URL]);

    // Fetch station statistics - simplified
    const fetchStats = useCallback(async () => {
        try {
            const totalCapacity = stations.reduce((sum, station) => sum + (station.capacity || 0), 0);
            const activeCount = stations.filter(station => station.isActive).length;

            setStats({
                totalStations: stations.length,
                activeStations: activeCount,
                totalCapacity,
                averageCapacity: stations.length > 0 ? Math.round(totalCapacity / stations.length) : 0
            });
        } catch (error) {
            console.warn('Could not calculate station stats:', error);
        }
    }, [stations]);

    // Add new station
    const addStation = async (newStation) => {
        try {
            setSaveLoading(true);

            const token = localStorage.getItem('louagi_token');

            const response = await fetch(`${API_BASE_URL}/stations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newStation.name,
                    address: newStation.address,
                    city: newStation.city,
                    state: newStation.state,
                    zipCode: newStation.zipCode,
                    capacity: parseInt(newStation.capacity),
                    contactPhone: newStation.contactPhone || null,
                    contactEmail: newStation.contactEmail || null,
                    amenities: newStation.amenities,
                    isActive: newStation.isActive
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Refresh stations list
                await fetchStations();
                alert('Station created successfully!');
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to create station');
            }
        } catch (error) {
            console.error('Create station error:', error);
            alert('Failed to create station: ' + error.message);
            return { success: false, error: error.message };
        } finally {
            setSaveLoading(false);
        }
    };

    // Export stations data
    const exportStations = () => {
        try {
            const csvContent = [
                ['Name', 'City', 'State', 'Address', 'Capacity', 'Status', 'Phone', 'Email'].join(','),
                ...stations.map(station => [
                    station.name,
                    station.city,
                    station.state,
                    station.address,
                    station.capacity,
                    station.isActive ? 'Active' : 'Inactive',
                    station.contactPhone || '',
                    station.contactEmail || ''
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stations-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export stations');
        }
    };

    // Refresh function
    const refreshStations = useCallback(() => {
        fetchStations();
    }, [fetchStations]);

    // Initial load effect - runs only once
    useEffect(() => {
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            fetchStations();
        }

        // Cleanup function
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Effect for filter changes (after initial load)
    useEffect(() => {
        if (!isInitialLoad.current) {
            fetchStations();
        }
    }, [filters.search, filters.page, fetchStations]);

    // Update stats when stations change
    useEffect(() => {
        if (stations.length > 0) {
            fetchStats();
        }
    }, [stations, fetchStats]);

    return {
        // Data
        stations,
        stats,
        pagination,

        // Loading states
        loading,
        error,
        saveLoading,

        // Filters (simplified)
        filters,
        setFilters,

        // Actions
        fetchStations: refreshStations,
        addStation,
        exportStations,

        // Computed
        hasFilters: Boolean(filters.search?.trim())
    };
};