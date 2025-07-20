// src/hooks/useSchedulesData.js - FIXED VERSION with working delete
import { useState, useEffect, useCallback } from 'react';

export const useSchedulesData = () => {
    const [schedules, setSchedules] = useState([]);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        stationId: '',
        dayOfWeek: '',
        isActive: ''
    });

    // Days of week mapping
    const daysOfWeek = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' }
    ];

    const fetchSchedules = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.stationId) params.append('stationId', filters.stationId);
            if (filters.dayOfWeek !== '') params.append('dayOfWeek', filters.dayOfWeek);
            if (filters.isActive !== '') params.append('isActive', filters.isActive);
            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${baseUrl}/schedules?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setSchedules(data.schedules || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    totalPages: data.totalPages || 0
                }));
            } else {
                throw new Error('Failed to fetch schedules');
            }
        } catch (err) {
            console.error('Error fetching schedules:', err);
            setError(err.message || 'Failed to fetch schedules');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, filters]);

    const fetchStations = useCallback(async () => {
        try {
            const token = localStorage.getItem('louagi_token');
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseUrl}/stations`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setStations(data.stations || []);
                }
            }
        } catch (err) {
            console.error('Error fetching stations:', err);
        }
    }, []);

    // FIXED DELETE FUNCTION - No double confirmation, proper error handling
    const deleteSchedule = async (scheduleId, stationName) => {
        try {
            console.log('🗑️ Starting delete process for schedule:', scheduleId);

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                alert('Authentication token not found. Please login again.');
                return;
            }

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            console.log('📡 Making DELETE request to:', `${baseUrl}/schedules/${scheduleId}`);

            const response = await fetch(`${baseUrl}/schedules/${scheduleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    console.warn('Could not parse error response as JSON');
                }

                console.error('❌ Delete failed:', errorMessage);

                if (response.status === 404) {
                    alert('Schedule not found. It may have already been deleted.');
                } else if (response.status === 403) {
                    alert('You do not have permission to delete this schedule.');
                } else if (response.status === 401) {
                    alert('Authentication failed. Please login again.');
                } else {
                    alert(`Failed to delete schedule: ${errorMessage}`);
                }
                return;
            }

            // Try to parse response
            let data;
            try {
                data = await response.json();
                console.log('✅ Delete response data:', data);
            } catch (parseError) {
                console.warn('Response was not JSON, but status was OK');
                data = { success: true }; // Assume success if we can't parse but got OK status
            }

            // Check if deletion was successful
            if (data.success !== false) { // Success if explicitly true OR not explicitly false
                console.log('🔄 Updating local state...');

                // Update local state immediately
                setSchedules(prevSchedules => prevSchedules.filter(schedule => schedule.id !== scheduleId));
                setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));

                console.log('✅ Schedule deleted successfully');
                alert(`Schedule for "${stationName}" deleted successfully!`);

                // Refresh the list to ensure consistency
                await fetchSchedules();
            } else {
                const errorMessage = data.message || 'Unknown error occurred';
                console.error('❌ Delete operation failed:', errorMessage);
                alert('Failed to delete schedule: ' + errorMessage);
            }

        } catch (error) {
            console.error('❌ Delete schedule error:', error);

            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                alert('Connection error. Please check if the backend is running and try again.');
            } else {
                alert('Error deleting schedule: ' + error.message);
            }
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleScheduleSave = (savedSchedule) => {
        const existingSchedule = schedules.find(s => s.id === savedSchedule.id);
        if (existingSchedule) {
            setSchedules(schedules.map(s => s.id === savedSchedule.id ? savedSchedule : s));
        } else {
            setSchedules([savedSchedule, ...schedules]);
            setPagination(prev => ({ ...prev, total: prev.total + 1 }));
        }
    };

    // Initialize data on mount
    useEffect(() => {
        fetchSchedules();
        fetchStations();
    }, [fetchSchedules, fetchStations]);

    return {
        schedules,
        stations,
        loading,
        error,
        pagination,
        filters,
        daysOfWeek,
        fetchSchedules,
        deleteSchedule, // This is the fixed version
        handleFilterChange,
        handlePageChange,
        handleScheduleSave,
        hasFilters: Object.values(filters).some(f => f)
    };
};