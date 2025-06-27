import React, { useState, useEffect } from 'react';
import {
    FileText,
    Users,
    DollarSign,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Eye,
    RefreshCw,
    Download,
    Filter,
    Search,
    Phone,
    Mail,
    Car,
    MapPin
} from 'lucide-react';

const BookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        paymentStatus: '',
        startDate: '',
        endDate: '',
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        total: 0,
        totalPages: 0,
        currentPage: 1
    });
    const [stats, setStats] = useState({
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0
    });
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        fetchBookings();
        fetchStats();
    }, [filters.search, filters.status, filters.paymentStatus, filters.startDate, filters.endDate, filters.page]);

    const fetchBookings = async () => {
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

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${baseUrl}/bookings?${params}`, {
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
                setBookings(data.bookings || []);
                setPagination({
                    total: data.summary?.totalBookings || 0,
                    totalPages: data.summary?.totalPages || 0,
                    currentPage: data.summary?.currentPage || 1
                });
            } else {
                throw new Error('Failed to fetch bookings data');
            }

        } catch (err) {
            console.error('❌ Bookings fetch error:', err);
            setError(err.message || 'Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('louagi_token');
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseUrl}/bookings/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setStats({
                        totalBookings: data.stats?.overview?.total || 0,
                        confirmedBookings: data.stats?.byStatus?.find(s => s.status === 'confirmed')?.count || 0,
                        pendingBookings: data.stats?.byStatus?.find(s => s.status === 'pending')?.count || 0,
                        cancelledBookings: data.stats?.byStatus?.find(s => s.status === 'cancelled')?.count || 0,
                        totalRevenue: data.stats?.overview?.totalRevenue || 0,
                        averageBookingValue: data.stats?.overview?.averageBookingValue || 0
                    });
                }
            }
        } catch (error) {
            console.warn('Could not fetch booking stats:', error);
        }
    };

    const updateBookingStatus = async (bookingId, newStatus, reason = '') => {
        try {
            const token = localStorage.getItem('louagi_token');
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseUrl}/bookings/${bookingId}/status`, {
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

                alert(`Booking status updated to ${newStatus}`);
            } else {
                alert('Failed to update booking status: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error updating booking status:', err);
            alert('Error updating booking status: ' + err.message);
        }
    };

    const viewBookingDetails = (booking) => {
        setSelectedBooking(booking);
        setShowDetails(true);
    };

    const exportBookings = () => {
        // Simple CSV export
        const csvContent = [
            ['Reference', 'Passenger', 'Trip', 'Seats', 'Amount', 'Status', 'Date'].join(','),
            ...bookings.map(booking => [
                booking.bookingReference,
                booking.passenger?.user?.username || 'Unknown',
                booking.trip?.route?.description || 'Unknown',
                booking.seats,
                booking.amount,
                booking.status,
                new Date(booking.createdAt).toLocaleDateString()
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

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
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error Loading Bookings</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <button
                                onClick={fetchBookings}
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
                        <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage passenger bookings, payments, and trip assignments
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={exportBookings}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                        <button
                            onClick={fetchBookings}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Bookings</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.totalBookings}</p>
                            <p className="text-xs text-gray-500 mt-1">All time</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-50">
                            <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Confirmed</p>
                            <p className="text-3xl font-bold text-green-600">{stats.confirmedBookings}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.totalBookings > 0 ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0}% of total
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
                            <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.pendingBookings}</p>
                            <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
                        </div>
                        <div className="p-3 rounded-full bg-yellow-50">
                            <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-3xl font-bold text-purple-600">${stats.totalRevenue.toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Avg: ${stats.averageBookingValue.toFixed(2)}
                            </p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-50">
                            <DollarSign className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow border p-6">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search bookings..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">No Show</option>
                    </select>

                    <select
                        value={filters.paymentStatus}
                        onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value, page: 1 }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Payments</option>
                        <option value="pending">Payment Pending</option>
                        <option value="completed">Paid</option>
                        <option value="failed">Payment Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>

                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                        <Filter className="w-4 h-4 mr-2" />
                        Clear
                    </button>
                </div>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-lg shadow border">
                <div className="p-6">
                    {bookings.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                            <p className="text-gray-600">
                                {filters.search || filters.status ?
                                    'Try adjusting your filters to see more bookings.' :
                                    'No bookings have been created yet.'}
                            </p>
                        </div>
                    ) : (
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
                                                        onClick={() => viewBookingDetails(booking)}
                                                        className="text-blue-600 hover:text-blue-800 p-1"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>

                                                    {booking.status === 'pending' && (
                                                        <button
                                                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
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
                                                                if (reason) updateBookingStatus(booking.id, 'cancelled', reason);
                                                            }}
                                                            className="text-red-600 hover:text-red-800 p-1"
                                                            title="Cancel Booking"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
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
                                Showing {bookings.length} of {pagination.total} bookings
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{stats.pendingBookings}</span> bookings awaiting confirmation
                        </div>
                        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            Review Pending
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Analysis</h3>
                    <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                            Total revenue: <span className="font-medium">${stats.totalRevenue.toFixed(2)}</span>
                        </div>
                        <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                            View Analytics
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations</h3>
                    <div className="space-y-3">
                        <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            Bulk Operations
                        </button>
                        <button
                            onClick={exportBookings}
                            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Export Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Booking Details Modal */}
            {showDetails && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-blue-600 px-6 py-4 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white">Booking Details</h2>
                                <button
                                    onClick={() => setShowDetails(false)}
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
                                        <div><span className="font-medium">Reference:</span> {selectedBooking.bookingReference}</div>
                                        <div><span className="font-medium">Seats:</span> {selectedBooking.seats}</div>
                                        <div><span className="font-medium">Amount:</span> ${parseFloat(selectedBooking.amount).toFixed(2)}</div>
                                        <div><span className="font-medium">Status:</span>
                                            <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedBooking.status)}`}>
                                                {selectedBooking.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div><span className="font-medium">Payment:</span>
                                            <span className={`ml-2 ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                                                {selectedBooking.paymentStatus.toUpperCase()}
                                            </span>
                                        </div>
                                        <div><span className="font-medium">Booked:</span> {new Date(selectedBooking.createdAt).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">Passenger Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div><span className="font-medium">Name:</span> {selectedBooking.passenger?.user?.username || 'Unknown'}</div>
                                        <div><span className="font-medium">Email:</span> {selectedBooking.passenger?.user?.email || 'N/A'}</div>
                                        <div><span className="font-medium">Phone:</span> {selectedBooking.passenger?.user?.phone || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <h3 className="font-semibold text-gray-900 mb-3">Trip Details</h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="font-medium">Route:</span> {selectedBooking.trip?.route?.description || 'Unknown'}</div>
                                        <div><span className="font-medium">Driver:</span> {selectedBooking.trip?.driver?.user?.username || 'Not assigned'}</div>
                                        <div><span className="font-medium">Departure:</span> {selectedBooking.trip?.departureTime ? new Date(selectedBooking.trip.departureTime).toLocaleString() : 'Not scheduled'}</div>
                                        <div><span className="font-medium">Estimated Arrival:</span> {selectedBooking.trip?.estimatedArrivalTime ? new Date(selectedBooking.trip.estimatedArrivalTime).toLocaleString() : 'N/A'}</div>
                                    </div>
                                </div>

                                {selectedBooking.specialRequests && (
                                    <div className="col-span-2">
                                        <h3 className="font-semibold text-gray-900 mb-3">Special Requests</h3>
                                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{selectedBooking.specialRequests}</p>
                                    </div>
                                )}

                                {selectedBooking.cancellationReason && (
                                    <div className="col-span-2">
                                        <h3 className="font-semibold text-gray-900 mb-3">Cancellation Reason</h3>
                                        <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{selectedBooking.cancellationReason}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex space-x-3">
                                {selectedBooking.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                updateBookingStatus(selectedBooking.id, 'confirmed');
                                                setShowDetails(false);
                                            }}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                        >
                                            Confirm Booking
                                        </button>
                                        <button
                                            onClick={() => {
                                                const reason = prompt('Cancellation reason:');
                                                if (reason) {
                                                    updateBookingStatus(selectedBooking.id, 'cancelled', reason);
                                                    setShowDetails(false);
                                                }
                                            }}
                                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                        >
                                            Cancel Booking
                                        </button>
                                    </>
                                )}

                                {selectedBooking.status === 'confirmed' && (
                                    <>
                                        <button
                                            onClick={() => {
                                                updateBookingStatus(selectedBooking.id, 'completed');
                                                setShowDetails(false);
                                            }}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                                        >
                                            Mark Completed
                                        </button>
                                        <button
                                            onClick={() => {
                                                updateBookingStatus(selectedBooking.id, 'no_show');
                                                setShowDetails(false);
                                            }}
                                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                                        >
                                            Mark No-Show
                                        </button>
                                    </>
                                )}

                                <button
                                    onClick={() => setShowDetails(false)}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                                >
                                    Close
                                </button>
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

export default BookingsPage;