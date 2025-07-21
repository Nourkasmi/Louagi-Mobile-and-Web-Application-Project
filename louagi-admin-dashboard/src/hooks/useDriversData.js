import { useState, useEffect, useCallback, useRef } from 'react';

export const useDriversData = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        page: 1,
        limit: 10
    });

    // Ref to track if this is the initial load
    const isInitialLoad = useRef(true);
    const abortControllerRef = useRef(null);

    // Real stats fetching
    const [stats, setStats] = useState({
        totalDrivers: 0,
        activeDrivers: 0,
        waitingInQueue: 0,
        averageRating: 0
    });

    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        currentPage: 1
    });

    // ✅ SIMPLIFIED: Fetch basic stats without complex joins
    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('louagi_token');
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            // Get simple driver count
            const driversResponse = await fetch(`${baseUrl}/users?role=driver&limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (driversResponse.ok) {
                const driversData = await driversResponse.json();

                setStats({
                    totalDrivers: driversData.total || 0,
                    activeDrivers: drivers.filter(d => d.isActive).length,
                    waitingInQueue: 0, // Will be updated separately if needed
                    averageRating: drivers.length > 0 ?
                        (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length).toFixed(1) : 0
                });
            }
        } catch (error) {
            console.warn('Could not fetch stats:', error);
            // Set default stats if fetch fails
            setStats({
                totalDrivers: drivers.length,
                activeDrivers: drivers.filter(d => d.isActive).length,
                waitingInQueue: 0,
                averageRating: drivers.length > 0 ?
                    (drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length).toFixed(1) : 0
            });
        }
    }, [drivers]);

    // ✅ SIMPLIFIED: Fetch drivers without complex joins
    const fetchDrivers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Cancel previous request if still pending
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            abortControllerRef.current = new AbortController();

            // Build query parameters
            const params = new URLSearchParams();
            if (filters.search && filters.search.trim()) {
                params.append('search', filters.search.trim());
            }
            params.append('page', filters.page.toString());
            params.append('limit', filters.limit.toString());
            params.append('role', 'driver'); // Only get drivers

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            console.log('📡 Fetching drivers from:', `${baseUrl}/users?${params}`);

            // Fetch drivers with their user data
            const driversResponse = await fetch(`${baseUrl}/users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: abortControllerRef.current.signal
            });

            if (!driversResponse.ok) {
                throw new Error(`HTTP error! status: ${driversResponse.status}`);
            }

            const driversData = await driversResponse.json();
            console.log('📥 Drivers response:', driversData);

            if (driversData.success) {
                // ✅ SIMPLIFIED: Transform data without complex async operations
                const transformedDrivers = driversData.users
                    .filter(user => user.role === 'driver') // Ensure only drivers
                    .map(user => {
                        const driver = user.driverProfile;

                        // Create driver object even if driverProfile is missing
                        return {
                            id: user.id,
                            name: user.username,
                            email: user.email,
                            phone: user.phone,
                            licenseNo: driver?.license_no || 'N/A',
                            rating: driver?.rating || 0,
                            totalTrips: 0, // Will be updated separately if needed
                            isVerified: driver?.is_verified || false,
                            isActive: user.isActive,
                            vehicleType: driver?.vehicle_type || 'Unknown',
                            vehicleCapacity: driver?.vehicle_capacity || 4,
                            currentStatus: 'offline', // Default status
                            queuePosition: null,
                            totalEarnings: 0, // Will be updated separately if needed
                            joinedDate: user.createdAt,
                            lastActive: user.lastLogin || user.updatedAt,
                            experience: driver?.experience || 0,
                            licenseExpiry: driver?.license_expiry
                        };
                    });

                console.log('✅ Transformed drivers:', transformedDrivers.length, 'drivers');

                setDrivers(transformedDrivers);
                setPagination({
                    total: driversData.total || transformedDrivers.length,
                    totalPages: driversData.totalPages || 1,
                    currentPage: driversData.currentPage || 1
                });

                console.log('✅ Drivers loaded successfully:', transformedDrivers.length);
            } else {
                throw new Error('Failed to fetch drivers data');
            }

        } catch (err) {
            // Don't show error for aborted requests
            if (err.name === 'AbortError') {
                console.log('🚫 Request cancelled');
                return;
            }

            console.error('❌ Drivers fetch error:', err);
            setError(err.message || 'Failed to load drivers');

            // Show user-friendly error based on error type
            if (err.message.includes('401') || err.message.includes('token')) {
                setError('Authentication failed. Please login again.');
            } else if (!navigator.onLine) {
                setError('No internet connection. Please check your network.');
            } else if (err.message.includes('404')) {
                setError('Drivers endpoint not found. Please check your backend.');
            } else {
                setError('Failed to load drivers. Please ensure the backend is running.');
            }
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // ✅ Initial load effect - only run once
    useEffect(() => {
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            fetchDrivers();
        }
    }, []);

    // ✅ Effect for filter changes (after initial load)
    useEffect(() => {
        if (!isInitialLoad.current) {
            const timeoutId = setTimeout(() => {
                fetchDrivers();
            }, 100); // Small delay to prevent rapid consecutive calls

            return () => clearTimeout(timeoutId);
        }
    }, [filters.search, filters.page]);

    // ✅ Load stats after drivers are loaded
    useEffect(() => {
        if (drivers.length > 0) {
            fetchStats();
        }
    }, [drivers, fetchStats]);

    // Cleanup function
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    }, [pagination.totalPages]);

    return {
        drivers,
        loading,
        error,
        stats,
        filters,
        pagination,
        fetchDrivers,
        setFilters,
        handlePageChange
    };
};