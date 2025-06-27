import React, { useState, useEffect } from 'react';
import {
    MapPin,
    Building,
    Users,
    Phone,
    Mail,
    Car,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    XCircle,
    Filter,
    Search,
    Download,
    Plus,
    Wifi,
    Coffee,
    Shield,
    Activity
} from 'lucide-react';

const StationsPage = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStation, setNewStation] = useState({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        capacity: 50,
        contactPhone: '',
        contactEmail: '',
        amenities: {
            wifi: false,
            toilets: false,
            foodCourt: false,
            security: false
        },
        isActive: true
    });
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        fetchStations();
        fetchStats();
    }, [filters.search, filters.city, filters.status, filters.page]); // Fixed dependencies

    const fetchStations = async () => {
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

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const stationsResponse = await fetch(`${baseUrl}/stations?${params}`, {
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
                            const queueResponse = await fetch(`${baseUrl}/queues/all?stationId=${station.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (queueResponse.ok) {
                                const queueData = await queueResponse.json();
                                currentQueues = queueData.queues?.length || 0;
                            }

                            // Get active trips from this station
                            const tripsResponse = await fetch(`${baseUrl}/trips?stationId=${station.id}&status=scheduled,in_progress`, {
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
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('louagi_token');
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseUrl}/stations?limit=1`, {
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
    };

    const handleAddStation = async (e) => {
        e.preventDefault();

        try {
            setSaveLoading(true);

            const token = localStorage.getItem('louagi_token');
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseUrl}/stations`, {
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
                // Reset form
                setNewStation({
                    name: '',
                    address: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    capacity: 50,
                    contactPhone: '',
                    contactEmail: '',
                    amenities: {
                        wifi: false,
                        toilets: false,
                        foodCourt: false,
                        security: false
                    },
                    isActive: true
                });

                setShowAddModal(false);

                // Refresh stations list
                fetchStations();
                fetchStats();

                alert('Station created successfully!');
            } else {
                throw new Error(data.message || 'Failed to create station');
            }
        } catch (error) {
            console.error('Create station error:', error);
            alert('Failed to create station: ' + error.message);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setNewStation(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAmenityChange = (amenity, checked) => {
        setNewStation(prev => ({
            ...prev,
            amenities: {
                ...prev.amenities,
                [amenity]: checked
            }
        }));
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const getStatusIcon = (isActive) => {
        return isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />;
    };

    const renderAmenities = (amenities) => {
        if (!amenities || Object.keys(amenities).length === 0) {
            return <span className="text-gray-400 text-xs">No amenities</span>;
        }

        const amenityIcons = {
            wifi: <Wifi className="w-3 h-3" />,
            foodCourt: <Coffee className="w-3 h-3" />,
            security: <Shield className="w-3 h-3" />,
            toilets: <Building className="w-3 h-3" />
        };

        return (
            <div className="flex space-x-1">
                {Object.entries(amenities).map(([key, value]) =>
                    value && amenityIcons[key] ? (
                        <div key={key} className="text-blue-500" title={key}>
                            {amenityIcons[key]}
                        </div>
                    ) : null
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                            <h3 className="text-sm font-medium text-red-800">Error Loading Stations</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <button
                                onClick={fetchStations}
                                className="mt-3 inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Retry
                            </button>
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
                        <h1 className="text-2xl font-bold text-gray-900">Stations Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage transportation stations, capacity, and operations
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                        <button
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center"
                            onClick={() => setShowAddModal(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Station
                        </button>
                        <button
                            onClick={fetchStations}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Stations</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.totalStations}</p>
                            <p className="text-xs text-gray-500 mt-1">Across all cities</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-50">
                            <Building className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Active Stations</p>
                            <p className="text-3xl font-bold text-green-600">{stats.activeStations}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.totalStations > 0 ? Math.round((stats.activeStations / stats.totalStations) * 100) : 0}% operational
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
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Capacity</p>
                            <p className="text-3xl font-bold text-purple-600">{stats.totalCapacity}</p>
                            <p className="text-xs text-gray-500 mt-1">Driver slots</p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-50">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Avg Capacity</p>
                            <p className="text-3xl font-bold text-orange-600">{stats.averageCapacity}</p>
                            <p className="text-xs text-gray-500 mt-1">Per station</p>
                        </div>
                        <div className="p-3 rounded-full bg-orange-50">
                            <Activity className="h-6 w-6 text-orange-600" />
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
                            placeholder="Search stations..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <input
                        type="text"
                        placeholder="Filter by city..."
                        value={filters.city}
                        onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        More Filters
                    </button>
                </div>
            </div>

            {/* Stations Table */}
            <div className="bg-white rounded-lg shadow border">
                <div className="p-6">
                    {stations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No stations found</h3>
                            <p className="text-gray-600">
                                {filters.search || filters.city ?
                                    'Try adjusting your filters to see more stations.' :
                                    'No stations have been created yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Station</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Location</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Capacity</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Activity</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stations.map((station) => (
                                        <tr key={station.id} className="border-b hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                        <MapPin className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{station.name}</div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {station.id.slice(0, 8)}...
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {renderAmenities(station.amenities)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900">{station.address}</div>
                                                    <div className="text-gray-500">{station.city}, {station.state}</div>
                                                    <div className="text-gray-400">{station.zipCode}</div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="text-sm">
                                                    {station.contactPhone && (
                                                        <div className="flex items-center text-gray-900 mb-1">
                                                            <Phone className="w-3 h-3 mr-1" />
                                                            {station.contactPhone}
                                                        </div>
                                                    )}
                                                    {station.contactEmail && (
                                                        <div className="flex items-center text-gray-500">
                                                            <Mail className="w-3 h-3 mr-1" />
                                                            {station.contactEmail}
                                                        </div>
                                                    )}
                                                    {!station.contactPhone && !station.contactEmail && (
                                                        <span className="text-gray-400 text-xs">No contact info</span>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="text-sm">
                                                    <div className="font-medium text-gray-900">{station.capacity} slots</div>
                                                    <div className="text-gray-500">
                                                        {station.currentQueues} in queue
                                                    </div>
                                                    <div className={`text-xs ${station.utilizationRate > 80 ? 'text-red-600' :
                                                        station.utilizationRate > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                        {station.utilizationRate}% utilized
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="text-sm">
                                                    <div className="flex items-center mb-1">
                                                        <Car className="w-3 h-3 text-blue-500 mr-1" />
                                                        <span className="font-medium">{station.activeTrips}</span>
                                                        <span className="text-gray-500 ml-1">active</span>
                                                    </div>
                                                    <div className="text-gray-400 text-xs">
                                                        Updated: {new Date(station.lastActivity).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(station.isActive)}`}>
                                                    {getStatusIcon(station.isActive)}
                                                    <span className="ml-1">{station.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                                </span>
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
                                                        title="Deactivate"
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
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <div className="text-sm text-gray-700">
                                Showing {stations.length} of {pagination.total} stations
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                    disabled={pagination.currentPage === 1}
                                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                                    {pagination.currentPage}
                                </span>
                                <button
                                    onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                                    disabled={pagination.currentPage >= pagination.totalPages}
                                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Management</h3>
                    <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{stats.totalCapacity}</span> total slots available
                        </div>
                        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            Optimize Capacity
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations</h3>
                    <div className="space-y-3">
                        <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            Live Queue Status
                        </button>
                        <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                            Schedule Management
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports</h3>
                    <div className="space-y-3">
                        <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                            Usage Analytics
                        </button>
                        <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                            Performance Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Improved Add Station Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                        <Plus className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Add New Station</h2>
                                        <p className="text-blue-100 text-sm">Create a new transportation hub</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                >
                                    <XCircle className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                            <form onSubmit={handleAddStation} className="space-y-6">
                                {/* Station Information Card */}
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Building className="w-5 h-5 text-blue-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">Station Information</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Station Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={newStation.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="e.g., Central Bus Station"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Capacity *
                                            </label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max="1000"
                                                value={newStation.capacity}
                                                onChange={(e) => handleInputChange('capacity', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Location Card */}
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <MapPin className="w-5 h-5 text-green-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">Location Details</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Full Address *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={newStation.address}
                                                onChange={(e) => handleInputChange('address', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="123 Main Street, Downtown"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    City *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newStation.city}
                                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="Tunis"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    State/Region *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newStation.state}
                                                    onChange={(e) => handleInputChange('state', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="Tunis"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Postal Code *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newStation.zipCode}
                                                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="1000"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information Card */}
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Phone className="w-5 h-5 text-purple-600" />
                                        <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                                        <span className="text-sm text-gray-500">(Optional)</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contact Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={newStation.contactPhone}
                                                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="+216 XX XXX XXX"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Contact Email
                                            </label>
                                            <input
                                                type="email"
                                                value={newStation.contactEmail}
                                                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="station@louagi.tn"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Amenities & Status Card */}
                                <div className="bg-gray-50 rounded-lg p-5">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900">Amenities & Status</h3>
                                    </div>

                                    {/* Amenities */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Available Amenities
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {Object.entries(newStation.amenities).map(([amenity, checked]) => (
                                                <label key={amenity} className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => handleAmenityChange(amenity, e.target.checked)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div className="flex items-center space-x-2">
                                                        {amenity === 'wifi' && <Wifi className="w-4 h-4 text-blue-500" />}
                                                        {amenity === 'toilets' && <Building className="w-4 h-4 text-gray-500" />}
                                                        {amenity === 'foodCourt' && <Coffee className="w-4 h-4 text-orange-500" />}
                                                        {amenity === 'security' && <Shield className="w-4 h-4 text-green-500" />}
                                                        <span className="text-sm font-medium text-gray-700 capitalize">
                                                            {amenity === 'foodCourt' ? 'Food Court' : amenity}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Active Status */}
                                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                                        <div className="flex items-center space-x-3">
                                            <Activity className="w-5 h-5 text-green-500" />
                                            <div>
                                                <span className="text-sm font-medium text-gray-900">Station Status</span>
                                                <p className="text-xs text-gray-500">Set whether this station is immediately operational</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newStation.isActive}
                                                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-medium text-gray-900">
                                                {newStation.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    * Required fields must be completed
                                </p>
                                <div className="flex items-center space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddStation}
                                        disabled={saveLoading}
                                        className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                                    >
                                        {saveLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                <span>Creating Station...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4" />
                                                <span>Create Station</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'} •
                Last updated: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

export default StationsPage;