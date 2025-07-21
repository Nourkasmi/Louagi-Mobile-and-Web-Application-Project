import { useState, useEffect, useCallback } from 'react';
import { showToast } from '../utils/toast';

export const useBookingsData = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const [stats, setStats] = useState({
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0
    });

    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        currentPage: 1
    });

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        paymentStatus: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 10
    });

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Fetch bookings data
    const fetchBookings = useCallback(async () => {
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
            if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            params.append('page', filters.page.toString());
            params.append('limit', filters.limit.toString());

            console.log('🔄 Fetching bookings with params:', params.toString());

            const response = await fetch(`${API_BASE_URL}/bookings?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Response status:', response.status);

            // Handle different response statuses
            if (response.status === 404) {
                // No bookings endpoint available - show empty state
                setBookings([]);
                setPagination({ total: 0, totalPages: 0, currentPage: 1 });
                setStats({
                    totalBookings: 0,
                    confirmedBookings: 0,
                    pendingBookings: 0,
                    cancelledBookings: 0,
                    totalRevenue: 0,
                    averageBookingValue: 0
                });
                console.log('ℹ️ Bookings endpoint not found - showing empty state');
                return;
            }

            if (response.status === 401) {
                throw new Error('Authentication failed. Please login again.');
            }

            if (response.status === 403) {
                throw new Error('Access denied. Admin privileges required.');
            }

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log('📊 Bookings data received:', data);

            // Handle successful response
            if (data.success) {
                const bookingsArray = data.bookings || data.data || [];
                setBookings(bookingsArray);

                // Handle pagination
                if (data.summary) {
                    setPagination({
                        total: data.summary.totalBookings || 0,
                        totalPages: data.summary.totalPages || 1,
                        currentPage: data.summary.currentPage || 1
                    });
                } else {
                    setPagination({
                        total: data.total || bookingsArray.length,
                        totalPages: data.totalPages || Math.ceil((data.total || bookingsArray.length) / filters.limit),
                        currentPage: data.currentPage || filters.page
                    });
                }

                console.log('✅ Bookings loaded successfully:', bookingsArray.length);
            } else {
                // Backend returned success: false
                const errorMessage = data.message || data.error || 'Failed to fetch bookings data';
                console.warn('⚠️ Backend returned success: false:', errorMessage);

                // Still show empty state rather than error
                setBookings([]);
                setPagination({ total: 0, totalPages: 0, currentPage: 1 });
            }

        } catch (err) {
            console.error('❌ Bookings fetch error:', err);

            // Provide user-friendly error messages
            if (err.message.includes('Authentication')) {
                setError('Please login again to view bookings.');
            } else if (err.message.includes('Access denied')) {
                setError('You need admin privileges to view all bookings.');
            } else if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
                setError('Unable to connect to server. Please check if the backend is running.');
            } else {
                setError('Unable to load bookings at the moment.');
            }

            setBookings([]);
            setPagination({ total: 0, totalPages: 0, currentPage: 1 });
        } finally {
            setLoading(false);
        }
    }, [filters, API_BASE_URL]);

    // Fetch booking statistics
    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('louagi_token');

            console.log('📊 Fetching booking stats...');

            const response = await fetch(`${API_BASE_URL}/bookings/stats`, {
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
                        totalBookings: data.stats.overview?.total || data.stats.totalBookings || 0,
                        confirmedBookings: data.stats.byStatus?.find(s => s.status === 'confirmed')?.count || 0,
                        pendingBookings: data.stats.byStatus?.find(s => s.status === 'pending')?.count || 0,
                        cancelledBookings: data.stats.byStatus?.find(s => s.status === 'cancelled')?.count || 0,
                        totalRevenue: data.stats.overview?.totalRevenue || data.stats.totalRevenue || 0,
                        averageBookingValue: data.stats.overview?.averageBookingValue || data.stats.averageBookingValue || 0
                    });
                } else {
                    console.warn('⚠️ Stats endpoint returned unexpected format:', data);
                    // Keep existing stats or set defaults
                    setStats(prevStats => prevStats.totalBookings > 0 ? prevStats : {
                        totalBookings: 0,
                        confirmedBookings: 0,
                        pendingBookings: 0,
                        cancelledBookings: 0,
                        totalRevenue: 0,
                        averageBookingValue: 0
                    });
                }
            } else {
                console.warn('⚠️ Stats endpoint failed:', response.status);
                // Don't overwrite existing stats on failure
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch booking stats:', error.message);
            // Keep existing stats on error
        }
    }, [API_BASE_URL]);

    // Update booking status
    const updateBookingStatus = async (bookingId, newStatus, reason = '') => {
        try {
            const token = localStorage.getItem('louagi_token');
            const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: newStatus,
                    cancellationReason: reason
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update local state
                setBookings(bookings.map(booking =>
                    booking.id === bookingId ? { ...booking, status: newStatus } : booking
                ));

                // Refresh stats
                fetchStats();
                showToast(`Booking status updated to ${newStatus}`, 'success');
                return { success: true };
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        } catch (err) {
            console.error('Error updating booking status:', err);
            showToast('Error updating booking status: ' + err.message, 'error');
            return { success: false, error: err.message };
        }
    };

    // Export bookings to CSV
    const exportBookings = () => {
        try {
            if (bookings.length === 0) {
                showToast('No bookings available to export', 'info');
                return;
            }

            const csvContent = [
                ['Reference', 'Passenger', 'Trip', 'Seats', 'Amount', 'Status', 'Date'].join(','),
                ...bookings.map(booking => [
                    booking.bookingReference || 'N/A',
                    booking.passenger?.user?.username || 'Unknown',
                    booking.trip?.route?.description || 'Unknown',
                    booking.seats || 0,
                    booking.amount || 0,
                    booking.status || 'Unknown',
                    booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'N/A'
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            showToast('Bookings exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            showToast('Failed to export bookings', 'error');
        }
    };

    // Refresh data
    const refreshData = async () => {
        setRefreshing(true);
        await Promise.all([fetchBookings(), fetchStats()]);
        setRefreshing(false);
        showToast('Data refreshed successfully', 'success');
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                await fetchBookings();
            } catch (error) {
                console.warn('Initial bookings fetch failed, will show empty state');
            }

            try {
                await fetchStats();
            } catch (error) {
                console.warn('Stats fetch failed, will show default stats');
            }
        };

        loadData();
    }, [fetchBookings, fetchStats]);

    return {
        // Data
        bookings,
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
        updateBookingStatus,
        exportBookings,
        refreshData,
        handlePageChange,

        // Computed
        hasFilters: Boolean(filters.search || filters.status || filters.paymentStatus || filters.startDate || filters.endDate)
    };
};