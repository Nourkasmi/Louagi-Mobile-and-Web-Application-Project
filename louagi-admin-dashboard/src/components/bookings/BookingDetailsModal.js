// src/components/bookings/BookingDetailsModal.js
import React from 'react';
import { XCircle } from 'lucide-react';

const BookingDetailsModal = ({
    booking,
    onClose,
    onUpdateStatus
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

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600';
            case 'pending': return 'text-yellow-600';
            case 'failed': return 'text-red-600';
            case 'refunded': return 'text-blue-600';
            default: return 'text-gray-600';
        }
    };

    const handleStatusUpdate = (newStatus, reason = '') => {
        onUpdateStatus(booking.id, newStatus, reason);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-blue-600 px-6 py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white">Booking Details</h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Booking Information</h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="font-medium">Reference:</span> {booking.bookingReference}</div>
                                <div><span className="font-medium">Seats:</span> {booking.seats}</div>
                                <div><span className="font-medium">Amount:</span> ${parseFloat(booking.amount).toFixed(2)}</div>
                                <div><span className="font-medium">Status:</span>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                                        {booking.status.toUpperCase()}
                                    </span>
                                </div>
                                <div><span className="font-medium">Payment:</span>
                                    <span className={`ml-2 ${getPaymentStatusColor(booking.paymentStatus)}`}>
                                        {booking.paymentStatus.toUpperCase()}
                                    </span>
                                </div>
                                <div><span className="font-medium">Booked:</span> {new Date(booking.createdAt).toLocaleString()}</div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Passenger Details</h3>
                            <div className="space-y-2 text-sm">
                                <div><span className="font-medium">Name:</span> {booking.passenger?.user?.username || 'Unknown'}</div>
                                <div><span className="font-medium">Email:</span> {booking.passenger?.user?.email || 'N/A'}</div>
                                <div><span className="font-medium">Phone:</span> {booking.passenger?.user?.phone || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <h3 className="font-semibold text-gray-900 mb-3">Trip Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-medium">Route:</span> {booking.trip?.route?.description || 'Unknown'}</div>
                                <div><span className="font-medium">Driver:</span> {booking.trip?.driver?.user?.username || 'Not assigned'}</div>
                                <div><span className="font-medium">Departure:</span> {booking.trip?.departureTime ? new Date(booking.trip.departureTime).toLocaleString() : 'Not scheduled'}</div>
                                <div><span className="font-medium">Estimated Arrival:</span> {booking.trip?.estimatedArrivalTime ? new Date(booking.trip.estimatedArrivalTime).toLocaleString() : 'N/A'}</div>
                            </div>
                        </div>

                        {booking.specialRequests && (
                            <div className="col-span-2">
                                <h3 className="font-semibold text-gray-900 mb-3">Special Requests</h3>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{booking.specialRequests}</p>
                            </div>
                        )}

                        {booking.cancellationReason && (
                            <div className="col-span-2">
                                <h3 className="font-semibold text-gray-900 mb-3">Cancellation Reason</h3>
                                <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{booking.cancellationReason}</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex space-x-3">
                        {booking.status === 'pending' && (
                            <>
                                <button
                                    onClick={() => handleStatusUpdate('confirmed')}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                >
                                    Confirm Booking
                                </button>
                                <button
                                    onClick={() => {
                                        const reason = prompt('Cancellation reason:');
                                        if (reason) handleStatusUpdate('cancelled', reason);
                                    }}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                >
                                    Cancel Booking
                                </button>
                            </>
                        )}

                        {booking.status === 'confirmed' && (
                            <>
                                <button
                                    onClick={() => handleStatusUpdate('completed')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                >
                                    Mark Completed
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate('no_show')}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                                >
                                    Mark No-Show
                                </button>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingDetailsModal;