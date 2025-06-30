// src/hooks/useSchedulesData.js
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

    const deleteSchedule = async (scheduleId, stationName) => {
        if (!window.confirm(`Are you sure you want to delete the schedule for "${stationName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('louagi_token');
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseUrl}/schedules/${scheduleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setSchedules(schedules.filter(schedule => schedule.id !== scheduleId));
                setPagination(prev => ({ ...prev, total: prev.total - 1 }));
                alert('Schedule deleted successfully!');
            } else {
                alert('Failed to delete schedule: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error deleting schedule:', err);
            alert('Error deleting schedule: ' + err.message);
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
        deleteSchedule,
        handleFilterChange,
        handlePageChange,
        handleScheduleSave,
        hasFilters: Object.values(filters).some(f => f)
    };
};
