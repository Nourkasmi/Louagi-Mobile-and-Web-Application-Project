// src/hooks/useDriversData.js
import { useState, useEffect, useCallback } from 'react';

export const useDriversData = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        verification: '',
        page: 1,
        limit: 10
    });

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

    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('louagi_token');
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            // Get driver statistics from multiple endpoints
            const [driversResponse, queueResponse] = await Promise.all([
                fetch(`${baseUrl}/users?role=driver&limit=1`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${baseUrl}/queues/count`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null) // Queue endpoint might not exist yet
            ]);

            const driversData = await driversResponse.json();
            const queueData = queueResponse ? await queueResponse.json() : null;

            setStats({
                totalDrivers: driversData.total || 0,
                activeDrivers: drivers.filter(d => d.isActive).length,
                waitingInQueue: queueData?.totalQueues || 0,
                averageRating: drivers.length > 0 ?
                    (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1) : 0
            });
        } catch (error) {
            console.warn('Could not fetch stats:', error);
        }
    }, [drivers]);

    // Real API data fetching
    const fetchDrivers = useCallback(async () => {
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
            if (filters.verification) params.append('verification', filters.verification);
            params.append('page', filters.page.toString());
            params.append('limit', filters.limit.toString());

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            // Fetch drivers with their user data and queue status
            const driversResponse = await fetch(`${baseUrl}/users?role=driver&${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!driversResponse.ok) {
                throw new Error(`HTTP error! status: ${driversResponse.status}`);
            }

            const driversData = await driversResponse.json();

            if (driversData.success) {
                // Transform the data to match our component structure
                const transformedDrivers = await Promise.all(
                    driversData.users.map(async (user) => {
                        const driver = user.driverProfile;
                        if (!driver) return null;

                        // Get driver's current queue status
                        let queueStatus = null;
                        try {
                            const queueResponse = await fetch(`${baseUrl}/drivers/status`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (queueResponse.ok) {
                                const queueData = await queueResponse.json();
                                queueStatus = queueData.driver?.queueEntry || null;
                            }
                        } catch (queueError) {
                            console.warn('Could not fetch queue status:', queueError);
                        }

                        // Get driver's trip count and earnings (you may need to add these endpoints)
                        let tripStats = { totalTrips: 0, totalEarnings: 0 };
                        try {
                            const statsResponse = await fetch(`${baseUrl}/drivers/earnings`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (statsResponse.ok) {
                                const statsData = await statsResponse.json();
                                tripStats = {
                                    totalTrips: statsData.earnings?.totalTrips || 0,
                                    totalEarnings: statsData.earnings?.totalEarnings || 0
                                };
                            }
                        } catch (statsError) {
                            console.warn('Could not fetch driver stats:', statsError);
                        }

                        return {
                            id: user.id,
                            name: user.username,
                            email: user.email,
                            phone: user.phone,
                            licenseNo: driver.license_no,
                            rating: driver.rating || 0,
                            totalTrips: tripStats.totalTrips,
                            isVerified: driver.is_verified,
                            isActive: user.isActive,
                            vehicleType: driver.vehicle_type || 'Unknown',
                            vehicleCapacity: driver.vehicle_capacity || 4,
                            currentStatus: queueStatus?.status || 'offline',
                            queuePosition: queueStatus?.position || null,
                            totalEarnings: tripStats.totalEarnings,
                            joinedDate: user.createdAt,
                            lastActive: user.lastLogin || user.updatedAt,
                            experience: driver.experience,
                            licenseExpiry: driver.license_expiry
                        };
                    })
                );

                // Filter out null values (users without driver profiles)
                const validDrivers = transformedDrivers.filter(driver => driver !== null);

                setDrivers(validDrivers);
                setPagination({
                    total: driversData.total || validDrivers.length,
                    totalPages: driversData.totalPages || 1,
                    currentPage: driversData.currentPage || 1
                });

                console.log('✅ Drivers loaded successfully:', validDrivers.length);
            } else {
                throw new Error('Failed to fetch drivers data');
            }

        } catch (err) {
            console.error('❌ Drivers fetch error:', err);
            setError(err.message || 'Failed to load drivers');

            // Show user-friendly error based on error type
            if (err.message.includes('401') || err.message.includes('token')) {
                setError('Authentication failed. Please login again.');
            } else if (!navigator.onLine) {
                setError('No internet connection. Please check your network.');
            } else {
                setError('Failed to load drivers. Please ensure the backend is running.');
            }
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchDrivers();
        fetchStats();
    }, [fetchDrivers, fetchStats]);

    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    }, [pagination.totalPages]);

    const handleExport = useCallback(() => {
        // Implementation for export functionality
        console.log('Exporting drivers data...');
    }, []);

    return {
        drivers,
        loading,
        error,
        stats,
        filters,
        pagination,
        fetchDrivers,
        setFilters,
        handlePageChange,
        handleExport
    };
};