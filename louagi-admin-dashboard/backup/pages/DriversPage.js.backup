import React, { useState, useEffect } from 'react';
import {
    Users,
    Car,
    Star,
    Shield,
    Clock,
    Phone,
    Mail,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle,
    Filter,
    Search,
    Download
} from 'lucide-react';

const DriversPage = () => {
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

    useEffect(() => {
        fetchDrivers();
        fetchStats();
    }, [filters.search, filters.status, filters.verification, filters.page]); // Fixed dependencies

    const fetchStats = async () => {
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
    };

    // Real API data fetching
    useEffect(() => {
        fetchDrivers();
    }, [filters]);

    const fetchDrivers = async () => {
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
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'waiting': return 'bg-yellow-100 text-yellow-800';
            case 'on_trip': return 'bg-green-100 text-green-800';
            case 'offline': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'waiting': return <Clock className="w-3 h-3" />;
            case 'on_trip': return <Car className="w-3 h-3" />;
            case 'offline': return <XCircle className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                {/* Connection Status */}
                <div className="text-xs text-gray-500 text-center">
                    ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'} •
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error Loading Drivers</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Drivers Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage drivers, verify licenses, and monitor performance
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                        <button
                            onClick={fetchDrivers}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Now with real data */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Drivers</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.totalDrivers}</p>
                            <p className="text-xs text-green-600 mt-1">All registered drivers</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-50">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Active Drivers</p>
                            <p className="text-3xl font-bold text-green-600">{stats.activeDrivers}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.totalDrivers > 0 ? Math.round((stats.activeDrivers / stats.totalDrivers) * 100) : 0}% online rate
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-green-50">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">In Queue</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.waitingInQueue}</p>
                            <p className="text-xs text-gray-500 mt-1">Currently waiting</p>
                        </div>
                        <div className="p-3 rounded-full bg-yellow-50">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Avg Rating</p>
                            <p className="text-3xl font-bold text-purple-600">{stats.averageRating}</p>
                            <p className="text-xs text-gray-500 mt-1">Overall performance</p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-50">
                            <Star className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow border p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search drivers..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="waiting">Waiting</option>
                        <option value="on_trip">On Trip</option>
                        <option value="offline">Offline</option>
                    </select>

                    <select
                        value={filters.verification}
                        onChange={(e) => setFilters(prev => ({ ...prev, verification: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Verification</option>
                        <option value="verified">Verified</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>

                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        More Filters
                    </button>
                </div>
            </div>

            {/* Drivers Table */}
            <div className="bg-white rounded-lg shadow border">
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Driver</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Vehicle</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drivers.map((driver) => (
                                    <tr key={driver.id} className="border-b hover:bg-gray-50">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                    <Car className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 flex items-center">
                                                        {driver.name}
                                                        {driver.isVerified && (
                                                            <Shield className="w-4 h-4 text-green-500 ml-2" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        License: {driver.licenseNo}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        Joined: {new Date(driver.joinedDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="text-sm">
                                                <div className="flex items-center text-gray-900 mb-1">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    {driver.email}
                                                </div>
                                                <div className="flex items-center text-gray-500">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {driver.phone}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">{driver.vehicleType}</div>
                                                <div className="text-gray-500">{driver.vehicleCapacity} seats</div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Exp: {driver.experience} years
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="text-sm">
                                                <div className="flex items-center mb-1">
                                                    <Star className="w-3 h-3 text-yellow-500 mr-1" />
                                                    <span className="font-medium">{driver.rating}</span>
                                                </div>
                                                <div className="text-gray-500">{driver.totalTrips} trips</div>
                                                <div className="text-green-600 font-medium">
                                                    ${driver.totalEarnings.toFixed(2)}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="space-y-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.currentStatus)}`}>
                                                    {getStatusIcon(driver.currentStatus)}
                                                    <span className="ml-1">{driver.currentStatus.replace('_', ' ').toUpperCase()}</span>
                                                </span>
                                                {driver.queuePosition && (
                                                    <div className="text-xs text-gray-500">
                                                        Queue: #{driver.queuePosition}
                                                    </div>
                                                )}
                                                <div className={`text-xs ${driver.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                    {driver.isActive ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-4 px-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="text-gray-600 hover:text-gray-800 p-1"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Suspend"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-700">
                            Showing {drivers.length} of {pagination.total} drivers
                        </div>
                        <div className="flex space-x-2">
                            <button
                                disabled={pagination.currentPage === 1}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                                {pagination.currentPage}
                            </span>
                            <button
                                disabled={pagination.currentPage >= pagination.totalPages}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Management</h3>
                    <div className="space-y-3">
                        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            View Live Queue
                        </button>
                        <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                            Reorder Queue
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Verification</h3>
                    <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">5</span> pending verifications
                        </div>
                        <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            Review Pending
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Reports</h3>
                    <div className="space-y-3">
                        <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                            Generate Report
                        </button>
                        <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                            View Analytics
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriversPage;