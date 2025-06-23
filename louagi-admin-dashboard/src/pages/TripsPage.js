import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import {
    Calendar,
    Clock,
    Users,
    Car,
    MapPin,
    DollarSign,
    Play,
    Square,
    CheckCircle,
    XCircle,
    Filter,
    Plus,
    RefreshCw,
    Eye,
    Edit,
    AlertCircle
} from 'lucide-react';

const TripsPage = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        page: 1,
        limit: 10,
        search: ''
    });
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        currentPage: 1
    });

    useEffect(() => {
        fetchTrips();
    }, [filters]);

    const fetchTrips = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Build query params for your existing backend API
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);
            params.append('page', filters.page.toString());
            params.append('limit', filters.limit.toString());

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${baseUrl}/trips?${params}`, {
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
                setTrips(data.trips || []);
                setPagination({
                    total: data.total || 0,
                    totalPages: data.totalPages || 0,
                    currentPage: data.currentPage || 1
                });
            } else {
                throw new Error('Failed to fetch trips');
            }
        } catch (err) {
            console.error('Error fetching trips:', err);
            setError(err.message || 'Failed to fetch trips');
        } finally {
            setLoading(false);
        }
    };

    // Update trip status using your backend API
    const updateTripStatus = async (tripId, newStatus) => {
        try {
            const token = localStorage.getItem('louagi_token');

            const response = await fetch(`${process.env.REACT_APP_API_URL}/trips/${tripId}/status`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();

            if (data.success) {
                // Update local state
                setTrips(trips.map(trip =>
                    trip.id === tripId ? { ...trip, status: newStatus } : trip
                ));
                alert('Trip status updated successfully!');
            } else {
                alert('Failed to update trip status: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error updating trip status:', err);
            alert('Error updating trip status: ' + err.message);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'scheduled': return <Clock className="w-4 h-4 text-blue-600" />;
            case 'in_progress': return <Play className="w-4 h-4 text-green-600" />;
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
            default: return <Clock className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-gray-100 text-gray-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    if (loading) {
        return <LoadingSpinner text="Loading trips..." />;
    }

    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Trips Management"
                    subtitle="Manage all trips and schedules"
                />
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error Loading Trips</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <p className="text-xs text-red-600 mt-2">
                                Make sure your backend is running on {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                            </p>
                            <button
                                onClick={fetchTrips}
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
            <PageHeader
                title="Trips Management"
                subtitle={`${pagination.total} trips found • Connected to backend`}
                action={
                    <div className="flex space-x-3">
                        <button
                            onClick={fetchTrips}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                    </div>
                }
            />

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center space-x-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search trips..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Trips List */}
            <div className="space-y-4">
                {trips.length === 0 ? (
                    <div className="bg-white rounded-lg shadow border p-8 text-center">
                        <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
                        <p className="text-gray-600">
                            {filters.status || filters.search ?
                                'Try adjusting your filters to see more trips.' :
                                'No trips have been created yet.'}
                        </p>
                    </div>
                ) : (
                    trips.map((trip) => (
                        <div key={trip.id} className="bg-white rounded-lg shadow border p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-4 mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {trip.route?.description || `Trip ${trip.id.slice(0, 8)}`}
                                        </h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                                            {getStatusIcon(trip.status)}
                                            <span className="ml-1">{trip.status?.replace('_', ' ').toUpperCase()}</span>
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <Car className="w-4 h-4 mr-2" />
                                            <div>
                                                <span className="font-medium">Driver:</span><br />
                                                {trip.driver?.user?.username || trip.driver?.name || 'Unknown'}
                                            </div>
                                        </div>

                                        <div className="flex items-center text-gray-600">
                                            <Clock className="w-4 h-4 mr-2" />
                                            <div>
                                                <span className="font-medium">Departure:</span><br />
                                                {formatDateTime(trip.departureTime)}
                                            </div>
                                        </div>

                                        <div className="flex items-center text-gray-600">
                                            <Users className="w-4 h-4 mr-2" />
                                            <div>
                                                <span className="font-medium">Seats:</span><br />
                                                {trip.availableSeats || 0}/{trip.capacity || 0} available
                                            </div>
                                        </div>

                                        <div className="flex items-center text-gray-600">
                                            <DollarSign className="w-4 h-4 mr-2" />
                                            <div>
                                                <span className="font-medium">Price:</span><br />
                                                {trip.currentPrice ? `$${trip.currentPrice}` : 'N/A'}
                                            </div>
                                        </div>
                                    </div>

                                    {trip.notes && (
                                        <div className="mt-3 text-sm text-gray-500">
                                            <span className="font-medium">Notes:</span> {trip.notes}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col space-y-2 ml-4">
                                    {trip.status === 'scheduled' && (
                                        <>
                                            <button
                                                onClick={() => updateTripStatus(trip.id, 'in_progress')}
                                                className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                            >
                                                <Play className="w-3 h-3 mr-1" />
                                                Start
                                            </button>
                                            <button
                                                onClick={() => updateTripStatus(trip.id, 'cancelled')}
                                                className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                            >
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Cancel
                                            </button>
                                        </>
                                    )}

                                    {trip.status === 'in_progress' && (
                                        <button
                                            onClick={() => updateTripStatus(trip.id, 'completed')}
                                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                        >
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Complete
                                        </button>
                                    )}

                                    <button className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200">
                                        <Eye className="w-3 h-3 mr-1" />
                                        Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
                    <div className="flex items-center text-sm text-gray-700">
                        <span>
                            Showing page {pagination.currentPage} of {pagination.totalPages}
                            ({pagination.total} total trips)
                        </span>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
            </div>
        </div>
    );
};

export default TripsPage;