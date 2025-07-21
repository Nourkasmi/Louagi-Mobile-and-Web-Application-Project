import React from 'react';
import {
    Car,
    Clock,
    Users,
    DollarSign,
    Play,
    CheckCircle,
    XCircle,
    Eye,
    Calendar,
    MapPin
} from 'lucide-react';

const TripTable = ({
    trips,
    loading,
    onUpdateStatus,
    onViewDetails
}) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'scheduled': return <Clock className="w-3 h-3" />;
            case 'in_progress': return <Play className="w-3 h-3" />;
            case 'completed': return <CheckCircle className="w-3 h-3" />;
            case 'cancelled': return <XCircle className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
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

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow border p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading trips...</span>
                </div>
            </div>
        );
    }

    if (trips.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow border p-8">
                <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Car className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
                    <p className="text-gray-600">
                        No trips have been created yet or match your current filters.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {trips.map((trip) => (
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
                                    <Calendar className="w-4 h-4 mr-2" />
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

                            <div className="mt-3 text-xs text-gray-400">
                                Trip ID: {trip.id?.slice(0, 8)}...
                                {trip.createdAt && (
                                    <> • Created: {new Date(trip.createdAt).toLocaleDateString()}</>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col space-y-2 ml-4">
                            {trip.status === 'scheduled' && (
                                <>
                                    <button
                                        onClick={() => onUpdateStatus(trip.id, 'in_progress')}
                                        className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                                    >
                                        <Play className="w-3 h-3 mr-1" />
                                        Start
                                    </button>
                                    <button
                                        onClick={() => onUpdateStatus(trip.id, 'cancelled')}
                                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                    >
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Cancel
                                    </button>
                                </>
                            )}

                            {trip.status === 'in_progress' && (
                                <button
                                    onClick={() => onUpdateStatus(trip.id, 'completed')}
                                    className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                >
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Complete
                                </button>
                            )}

                            <button
                                onClick={() => onViewDetails(trip)}
                                className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                            >
                                <Eye className="w-3 h-3 mr-1" />
                                Details
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TripTable;