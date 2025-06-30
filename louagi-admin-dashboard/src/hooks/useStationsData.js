// src/hooks/useStationsData.js
import { useState, useEffect, useCallback } from 'react';

export const useStationsData = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saveLoading, setSaveLoading] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        city: '',
        status: '',
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

    // Fetch stations with enhanced data
    const fetchStations = useCallback(async () => {
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
            if (filters.city) params.append('city', filters.city);
            params.append('page', filters.page.toString());
            params.append('limit', filters.limit.toString());

            const stationsResponse = await fetch(`${API_BASE_URL}/stations?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!stationsResponse.ok) {
                throw new Error(`HTTP error! status: ${stationsResponse.status}`);
            }

            const stationsData = await stationsResponse.json();

            if (stationsData.success) {
                // Enhance station data with additional metrics
                const enhancedStations = await Promise.all(
                    stationsData.stations.map(async (station) => {
                        // Get current queue count for this station
                        let currentQueues = 0;
                        let activeTrips = 0;

                        try {
                            // Get queue data for this station
                            const queueResponse = await fetch(`${API_BASE_URL}/queues/all?stationId=${station.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (queueResponse.ok) {
                                const queueData = await queueResponse.json();
                                currentQueues = queueData.queues?.length || 0;
                            }

                            // Get active trips from this station
                            const tripsResponse = await fetch(`${API_BASE_URL}/trips?stationId=${station.id}&status=scheduled,in_progress`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (tripsResponse.ok) {
                                const tripsData = await tripsResponse.json();
                                activeTrips = tripsData.trips?.length || 0;
                            }
                        } catch (apiError) {
                            console.warn('Could not fetch station metrics:', apiError);
                        }

                        return {
                            ...station,
                            currentQueues,
                            activeTrips,
                            utilizationRate: station.capacity > 0 ?
                                Math.round((currentQueues / station.capacity) * 100) : 0,
                            lastActivity: station.updatedAt,
                            amenitiesList: station.amenities ? Object.keys(station.amenities) : []
                        };
                    })
                );

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
    }, [filters, API_BASE_URL]);

    // Fetch station statistics
    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('louagi_token');

            const response = await fetch(`${API_BASE_URL}/stations?limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                const totalCapacity = stations.reduce((sum, station) => sum + (station.capacity || 0), 0);
                const activeCount = stations.filter(station => station.isActive).length;

                setStats({
                    totalStations: data.total || 0,
                    activeStations: activeCount,
                    totalCapacity,
                    averageCapacity: stations.length > 0 ? Math.round(totalCapacity / stations.length) : 0
                });
            }
        } catch (error) {
            console.warn('Could not fetch station stats:', error);
        }
    }, [stations, API_BASE_URL]);

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
                await fetchStats();

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

    // Initialize data
    useEffect(() => {
        fetchStations();
    }, [fetchStations]);

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

        // Filters
        filters,
        setFilters,

        // Actions
        fetchStations,
        addStation,
        exportStations,

        // Computed
        hasFilters: Boolean(filters.search || filters.city || filters.status)
    };
};