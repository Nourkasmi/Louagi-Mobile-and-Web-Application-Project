import React from 'react';
import {
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Mail,
    Phone,
    Calendar,
    Car,
    MapPin,
    FileText
} from 'lucide-react';

const BookingTable = ({
    bookings,
    onViewDetails,
    onUpdateStatus,
    loading
}) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'no_show': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmed': return <CheckCircle className="w-3 h-3" />;
            case 'pending': return <Clock className="w-3 h-3" />;
            case 'cancelled': return <XCircle className="w-3 h-3" />;
            case 'completed': return <CheckCircle className="w-3 h-3" />;
            case 'no_show': return <AlertTriangle className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'pending': return 'text-yellow-600';
            case 'failed': return 'text-red-600';
            case 'refunded': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow border p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading bookings...</span>
                </div>
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow border p-8">
                <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                    <p className="text-gray-600">
                        No bookings have been created yet or match your current filters.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow border">
            <div className="p-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Booking</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Passenger</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Trip Details</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Payment</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="border-b hover:bg-gray-50">
                                    <td className="py-4 px-4">
                                        <div>
                                            <div className="font-medium text-gray-900">{booking.bookingReference}</div>
                                            <div className="text-sm text-gray-500">
                                                {booking.seats} seat{booking.seats > 1 ? 's' : ''}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(booking.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900 mb-1">
                                                {booking.passenger?.user?.username || 'Unknown'}
                                            </div>
                                            {booking.passenger?.user?.email && (
                                                <div className="flex items-center text-gray-500 mb-1">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    {booking.passenger.user.email}
                                                </div>
                                            )}
                                            {booking.passenger?.user?.phone && (
                                                <div className="flex items-center text-gray-500">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {booking.passenger.user.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            <div className="flex items-center font-medium text-gray-900 mb-1">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {booking.trip?.route?.description || 'Unknown Route'}
                                            </div>
                                            <div className="flex items-center text-gray-500 mb-1">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {booking.trip?.departureTime ?
                                                    new Date(booking.trip.departureTime).toLocaleDateString() :
                                                    'Not scheduled'}
                                            </div>
                                            <div className="flex items-center text-gray-500">
                                                <Car className="w-3 h-3 mr-1" />
                                                {booking.trip?.driver?.user?.username || 'No driver assigned'}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900">
                                                ${parseFloat(booking.amount).toFixed(2)}
                                            </div>
                                            <div className={`text-xs ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                                {booking.paymentStatus.replace('_', ' ').toUpperCase()}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4 px-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                            {getStatusIcon(booking.status)}
                                            <span className="ml-1">{booking.status.replace('_', ' ').toUpperCase()}</span>
                                        </span>
                                        {booking.specialRequests && (
                                            <div className="text-xs text-blue-600 mt-1">
                                                Special requests
                                            </div>
                                        )}
                                    </td>

                                    <td className="py-4 px-4">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => onViewDetails(booking)}
                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>

                                            {booking.status === 'pending' && (
                                                <button
                                                    onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                                                    className="text-green-600 hover:text-green-800 p-1"
                                                    title="Confirm Booking"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}

                                            {['pending', 'confirmed'].includes(booking.status) && (
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Cancellation reason:');
                                                        if (reason) onUpdateStatus(booking.id, 'cancelled', reason);
                                                    }}
                                                    className="text-red-600 hover:text-red-800 p-1"
                                                    title="Cancel Booking"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}

                                            {booking.status === 'confirmed' && (
                                                <>
                                                    <button
                                                        onClick={() => onUpdateStatus(booking.id, 'completed')}
                                                        className="text-blue-600 hover:text-blue-800 p-1"
                                                        title="Mark Completed"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => onUpdateStatus(booking.id, 'no_show')}
                                                        className="text-gray-600 hover:text-gray-800 p-1"
                                                        title="Mark No-Show"
                                                    >
                                                        <AlertTriangle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BookingTable;