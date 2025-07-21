import { useState, useEffect, useCallback } from 'react';
import { showToast } from '../utils/toast';

export const useDestinationsData = () => {
    const [destinations, setDestinations] = useState([]);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        isActive: 'all',
        startStation: 'all',
        endStation: 'all'
    });

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

    // Fetch destinations
    const fetchDestinations = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query parameters
            const params = new URLSearchParams();
            if (searchTerm.trim()) params.append('search', searchTerm.trim());
            if (filters.isActive !== 'all') params.append('isActive', filters.isActive);
            if (filters.startStation !== 'all') params.append('startId', filters.startStation);
            if (filters.endStation !== 'all') params.append('endId', filters.endStation);
            params.append('page', currentPage.toString());
            params.append('limit', itemsPerPage.toString());

            const data = await apiCall(`/destinations?${params}`);

            if (data.success) {
                setDestinations(data.destinations || []);
                setTotalPages(data.totalPages || 1);
            } else {
                throw new Error(data.message || 'Failed to fetch destinations');
            }

        } catch (err) {
            console.error('Error fetching destinations:', err);
            setError(err.message || 'Failed to load destinations');
            setDestinations([]);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, filters, currentPage, apiCall]);

    // Fetch stations for dropdown options
    const fetchStations = useCallback(async () => {
        try {
            const data = await apiCall('/stations');
            if (data.success) {
                setStations(data.stations || []);
            }
        } catch (err) {
            console.error('Error fetching stations:', err);
            // Don't show error for stations, just use empty array
        }
    }, [apiCall]);

    // Create destination
    const createDestination = async (formData) => {
        try {
            setSubmitting(true);

            const data = await apiCall('/destinations', {
                method: 'POST',
                body: JSON.stringify({
                    startId: formData.startId,
                    endId: formData.endId,
                    distance: parseFloat(formData.distance),
                    basePrice: parseFloat(formData.basePrice),
                    estimatedDuration: parseInt(formData.estimatedDuration),
                    description: formData.description || null,
                    isActive: formData.isActive
                })
            });

            if (data.success) {
                showToast('Destination created successfully!', 'success');
                await fetchDestinations();
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to create destination');
            }

        } catch (err) {
            console.error('Error creating destination:', err);
            showToast('Error creating destination: ' + err.message, 'error');
            return { success: false, error: err.message };
        } finally {
            setSubmitting(false);
        }
    };

    // Update destination
    const updateDestination = async (destinationId, formData) => {
        try {
            setSubmitting(true);

            const data = await apiCall(`/destinations/${destinationId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    startId: formData.startId,
                    endId: formData.endId,
                    distance: parseFloat(formData.distance),
                    basePrice: parseFloat(formData.basePrice),
                    estimatedDuration: parseInt(formData.estimatedDuration),
                    description: formData.description || null,
                    isActive: formData.isActive
                })
            });

            if (data.success) {
                showToast('Destination updated successfully!', 'success');
                await fetchDestinations();
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to update destination');
            }

        } catch (err) {
            console.error('Error updating destination:', err);
            showToast('Error updating destination: ' + err.message, 'error');
            return { success: false, error: err.message };
        } finally {
            setSubmitting(false);
        }
    };

    // Delete destination
    const deleteDestination = async (destination) => {
        const confirmMessage = `Are you sure you want to delete the route from ${destination.startStation?.name} to ${destination.endStation?.name}? This action cannot be undone.`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            const data = await apiCall(`/destinations/${destination.id}`, {
                method: 'DELETE'
            });

            if (data.success) {
                showToast('Destination deleted successfully!', 'success');
                await fetchDestinations();
            } else {
                throw new Error(data.message || 'Failed to delete destination');
            }

        } catch (err) {
            console.error('Error deleting destination:', err);
            showToast('Error deleting destination: ' + err.message, 'error');
        }
    };

    // --- FIXED EFFECTS ---

    // Load initial data (mount only)
    useEffect(() => {
        fetchStations();
        fetchDestinations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Refetch destinations on search/filter/page change (no loading dependency!)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDestinations();
        }, 300); // Debounce

        return () => clearTimeout(timer);
    }, [searchTerm, filters, currentPage, fetchDestinations]);

    return {
        // Data
        destinations,
        stations,
        loading,
        error,
        submitting,

        // Pagination
        currentPage,
        totalPages,
        setCurrentPage,

        // Filters
        searchTerm,
        setSearchTerm,
        filters,
        setFilters,

        // Actions
        fetchDestinations,
        createDestination,
        updateDestination,
        deleteDestination,

        // Computed
        hasFilters: Boolean(
            searchTerm.trim() ||
            filters.isActive !== 'all' ||
            filters.startStation !== 'all' ||
            filters.endStation !== 'all'
        )
    };
};
