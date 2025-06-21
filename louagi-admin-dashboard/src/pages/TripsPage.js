import React, { useState, useEffect } from 'react';
import { tripsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import toast from 'react-hot-toast';

const TripsPage = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        search: ''
    });

    useEffect(() => {
        fetchTrips();
    }, [filters]);

    const fetchTrips = async () => {
        try {
            setLoading(true);

            const params = {
                limit: 50,
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.search && { search: filters.search })
            };

            const response = await tripsAPI.getAll(params);
            setTrips(response.data.trips || []);
        } catch (error) {
            console.error('Trips fetch error:', error);
            toast.error('Failed to load trips');
        } finally {
            setLoading(false);
        }
    };

    const updateTripStatus = async (tripId, newStatus) => {
        try {
            await tripsAPI.updateStatus(tripId, { status: newStatus });
            toast.success(`Trip ${newStatus} successfully`);
            fetchTrips(); // Refresh list
        } catch (error) {
            console.error('Update trip error:', error);
            toast.error('Failed to update trip status');
        }
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in_progress':
                return 'bg-blue-100 text-blue-800';
            case 'scheduled':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading trips..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Trips Management"
                subtitle={`${trips.length} trips found`}
                action={
                    <div className="flex space-x-2">
                        <button
                            onClick={fetchTrips}
                            className="btn-secondary"
                        >
                            Refresh
                        </button>
                        <button className="btn-primary">
                            Create Trip
                        </button>
                    </div>
                }
            />

            {/* Filters */}
            <div className="card p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Search trips..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="input-field w-full"
                        />
                    </div>
                    <div>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="input-field"
                        >
                            <option value="all">All Status</option>
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
                    <div className="card p-8 text-center text-gray-500">
                        No trips found
                    </div>
                ) : (
                    trips.map((trip) => (
                        <div key={trip.id} className="card p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-4 mb-2">
                                        <h3 className="text-lg font-semibold">
                                            {trip.route?.description || 'Unknown Route'}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trip.status)}`}>
                                            {trip.status.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium">Driver:</span><br />
                                            {trip.driver?.user?.username || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-medium">Departure:</span><br />
                                            {formatDateTime(trip.departureTime)}
                                        </div>
                                        <div>
                                            <span className="font-medium">Seats:</span><br />
                                            {trip.availableSeats}/{trip.capacity} available
                                        </div>
                                        <div>
                                            <span className="font-medium">Price:</span><br />
                                            ${trip.currentPrice}
                                        </div>
                                    </div>

                                    {trip.notes && (
                                        <div className="mt-2 text-sm text-gray-500">
                                            <span className="font-medium">Notes:</span> {trip.notes}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-4 lg:mt-0 lg:ml-4">
                                    {trip.status === 'scheduled' && (
                                        <>
                                            <button
                                                onClick={() => updateTripStatus(trip.id, 'in_progress')}
                                                className="btn-primary text-sm"
                                            >
                                                Start Trip
                                            </button>
                                            <button
                                                onClick={() => updateTripStatus(trip.id, 'cancelled')}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                            >
                                                Cancel
                                            </button>
                                        </>
                                    )}
                                    {trip.status === 'in_progress' && (
                                        <button
                                            onClick={() => updateTripStatus(trip.id, 'completed')}
                                            className="btn-primary text-sm"
                                        >
                                            Complete Trip
                                        </button>
                                    )}
                                    <button className="btn-secondary text-sm">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TripsPage;