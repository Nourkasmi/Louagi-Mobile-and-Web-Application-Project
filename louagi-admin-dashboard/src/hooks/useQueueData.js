// src/hooks/useQueueData.js
import { useState, useEffect, useCallback } from 'react';
import { showToast } from '../utils/toast';

export const useQueueData = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    // Data states
    const [queues, setQueues] = useState([]);
    const [stations, setStations] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [schedules, setSchedules] = useState([]);

    // Filter states
    const [selectedStation, setSelectedStation] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState('');
    const [selectedDestination, setSelectedDestination] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Helper function for API calls
    const apiCall = useCallback(async (url, options = {}) => {
        const token = localStorage.getItem('louagi_token');
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }, [API_BASE_URL]);

    // Fetch initial data (stations, destinations, schedules)
    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [stationsRes, destinationsRes, schedulesRes] = await Promise.all([
                apiCall('/stations'),
                apiCall('/destinations'),
                apiCall('/schedules')
            ]);

            setStations(stationsRes.stations || []);
            setDestinations(destinationsRes.destinations || []);
            setSchedules(schedulesRes.schedules || []);

        } catch (error) {
            console.error('Error fetching initial data:', error);
            setError(error.message);
            showToast('Failed to load initial data: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    // Fetch queue data for selected filters
    const fetchQueueData = useCallback(async () => {
        if (!selectedStation || !selectedSchedule || !selectedDestination) {
            return;
        }

        try {
            setRefreshing(true);
            setError(null);

            const response = await apiCall(
                `/queues?stationId=${selectedStation}&scheduleId=${selectedSchedule}&destinationId=${selectedDestination}`
            );

            setQueues(response.queue || []);

            if (response.queue && response.queue.length === 0) {
                showToast('No drivers currently in this queue', 'info');
            }

        } catch (error) {
            console.error('Error fetching queue data:', error);
            setError(error.message);
            showToast('Failed to fetch queue data: ' + error.message, 'error');
            setQueues([]);
        } finally {
            setRefreshing(false);
        }
    }, [selectedStation, selectedSchedule, selectedDestination, apiCall]);

    // Update queue entry
    const updateQueueEntry = async (queueId, updates) => {
        try {
            setActionLoading(prev => ({ ...prev, [queueId]: true }));

            const response = await apiCall(`/queues/${queueId}`, {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });

            if (response.success) {
                await fetchQueueData();
                showToast('Queue updated successfully', 'success');
                return { success: true };
            }

        } catch (error) {
            console.error('Error updating queue entry:', error);
            showToast('Failed to update queue: ' + error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            setActionLoading(prev => ({ ...prev, [queueId]: false }));
        }
    };

    // Queue actions
    const moveDriverUp = async (queueEntry) => {
        if (queueEntry.position > 1) {
            return await updateQueueEntry(queueEntry.id, {
                position: queueEntry.position - 1,
                status: queueEntry.status
            });
        }
    };

    const moveDriverDown = async (queueEntry) => {
        return await updateQueueEntry(queueEntry.id, {
            position: queueEntry.position + 1,
            status: queueEntry.status
        });
    };

    const markDriverCalled = async (queueEntry) => {
        return await updateQueueEntry(queueEntry.id, {
            position: queueEntry.position,
            status: 'called'
        });
    };

    const markDriverDone = async (queueEntry) => {
        return await updateQueueEntry(queueEntry.id, {
            position: queueEntry.position,
            status: 'done'
        });
    };

    const skipDriver = async (queueEntry) => {
        return await updateQueueEntry(queueEntry.id, {
            position: queueEntry.position,
            status: 'skipped'
        });
    };

    // Helper functions
    const getSchedulesForStation = (stationId) => {
        return schedules.filter(schedule => schedule.stationId === stationId);
    };

    const getDestinationsForStation = (stationId) => {
        return destinations.filter(dest => dest.startId === stationId);
    };

    const clearFilters = () => {
        setSelectedStation('');
        setSelectedSchedule('');
        setSelectedDestination('');
        setQueues([]);
        setError(null);
    };

    // Load initial data on mount
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // Fetch queue data when filters change
    useEffect(() => {
        if (selectedStation && selectedSchedule && selectedDestination) {
            fetchQueueData();
        }
    }, [selectedStation, selectedSchedule, selectedDestination, fetchQueueData]);

    return {
        // Data
        queues,
        stations,
        destinations,
        schedules,

        // Loading states
        loading,
        refreshing,
        actionLoading,
        error,

        // Filters
        selectedStation,
        selectedSchedule,
        selectedDestination,
        setSelectedStation,
        setSelectedSchedule,
        setSelectedDestination,

        // Actions
        fetchQueueData,
        moveDriverUp,
        moveDriverDown,
        markDriverCalled,
        markDriverDone,
        skipDriver,
        clearFilters,

        // Helpers
        getSchedulesForStation,
        getDestinationsForStation,

        // Computed
        hasFiltersSelected: Boolean(selectedStation && selectedSchedule && selectedDestination)
    };
};