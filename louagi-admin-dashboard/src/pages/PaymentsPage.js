import React, { useState } from 'react';
import { Download, RefreshCw, DollarSign, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useBookingsData } from '../hooks/useBookingsData';

const PaymentsPage = () => {
    const {
        bookings,
        loading,
        error,
        refreshing,
        refreshData,
    } = useBookingsData();

    const [filters, setFilters] = useState({
        status: 'all',
        paymentStatus: 'all',
        dateRange: '30',
        search: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    // Convert bookings to payment transactions
    const getPaymentsFromBookings = () => {
        if (!bookings || bookings.length === 0) return [];

        return bookings.map(booking => ({
            id: booking.id,
            bookingReference: booking.bookingReference,
            amount: parseFloat(booking.amount) || 0,
            currency: 'USD',
            status: booking.paymentStatus || 'pending',
            method: 'stripe', // You can get this from booking data if available
            customer: {
                name: booking.passenger?.user?.username || 'Unknown',
                email: booking.passenger?.user?.email || 'N/A'
            },
            booking: booking,
            createdAt: booking.createdAt,
            refunded: booking.status === 'cancelled' && booking.paymentStatus === 'refunded'
        }));
    };

    // Filter payments based on current filters
    const getFilteredPayments = () => {
        let payments = getPaymentsFromBookings();

        // Apply status filter
        if (filters.status !== 'all') {
            payments = payments.filter(payment => payment.status === filters.status);
        }

        // Apply payment status filter (same as status for bookings)
        if (filters.paymentStatus !== 'all') {
            payments = payments.filter(payment => payment.status === filters.paymentStatus);
        }

        // Apply search filter
        if (filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase();
            payments = payments.filter(payment =>
                payment.bookingReference?.toLowerCase().includes(searchTerm) ||
                payment.customer.name?.toLowerCase().includes(searchTerm) ||
                payment.customer.email?.toLowerCase().includes(searchTerm)
            );
        }

        // Apply date filter
        if (filters.dateRange !== 'all') {
            const days = parseInt(filters.dateRange);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            payments = payments.filter(payment =>
                new Date(payment.createdAt) >= cutoffDate
            );
        }

        return payments;
    };

    // Calculate payment statistics
    const getPaymentStats = () => {
        const payments = getPaymentsFromBookings();

        // Debug: Log payment statuses to see what we have
        console.log('Payment statuses:', payments.map(p => ({ id: p.id, status: p.status, amount: p.amount })));

        // Calculate total revenue from all non-cancelled bookings
        const totalRevenue = payments
            .filter(p => p.status !== 'failed' && p.status !== 'cancelled') // Include completed, pending, etc.
            .reduce((sum, p) => sum + p.amount, 0);

        // Calculate refunds from cancelled bookings that were paid
        const totalRefunds = payments
            .filter(p => p.refunded || (p.booking.status === 'cancelled' && p.status === 'completed'))
            .reduce((sum, p) => sum + p.amount, 0);

        // Calculate confirmed revenue (only completed payments)
        const confirmedRevenue = payments
            .filter(p => p.status === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);

        const netRevenue = confirmedRevenue - totalRefunds;

        console.log('Payment Stats:', {
            total: payments.length,
            totalRevenue,
            confirmedRevenue,
            totalRefunds,
            netRevenue
        });

        return {
            total: payments.length,
            totalRevenue,
            confirmedRevenue,
            totalRefunds,
            netRevenue
        };
    };

    // Pagination logic
    const filteredPayments = getFilteredPayments();
    const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

    const stats = getPaymentStats();

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'refunded': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Export payments to CSV
    const exportPayments = () => {
        if (filteredPayments.length === 0) {
            alert('No payments to export');
            return;
        }

        const csvContent = [
            ['Booking Reference', 'Customer', 'Email', 'Amount', 'Status', 'Date'].join(','),
            ...filteredPayments.map(payment => [
                payment.bookingReference || 'N/A',
                payment.customer.name || 'Unknown',
                payment.customer.email || 'N/A',
                payment.amount,
                payment.status,
                formatDate(payment.createdAt)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading && bookings.length === 0) {
        return (
            <div className="space-y-6">
                <PageHeader title="Payments Management" subtitle="Loading..." />
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="large" text="Loading payment data..." />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader title="Payments Management" subtitle="Error loading data" />
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error Loading Payment Data</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <button
                                onClick={refreshData}
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
                title="Payments Management"
                subtitle="Financial transactions and payment processing (from bookings data)"
                action={
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={exportPayments}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                        </button>
                        <button
                            onClick={refreshData}
                            disabled={refreshing}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                }
            />

            {/* Payment Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Payments</p>
                            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100">
                            <CreditCard className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
                            <p className="text-xs text-gray-500 mt-1">All bookings</p>
                        </div>
                        <div className="p-3 rounded-full bg-green-100">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Confirmed Revenue</p>
                            <p className="text-3xl font-bold text-blue-600">{formatCurrency(stats.confirmedRevenue)}</p>
                            <p className="text-xs text-gray-500 mt-1">Completed payments only</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Refunds</p>
                            <p className="text-3xl font-bold text-purple-600">{formatCurrency(stats.totalRefunds)}</p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-100">
                            <RefreshCw className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Net Revenue</p>
                            <p className="text-3xl font-bold text-indigo-600">{formatCurrency(stats.netRevenue)}</p>
                            <p className="text-xs text-gray-500 mt-1">Confirmed - Refunds</p>
                        </div>
                        <div className="p-3 rounded-full bg-indigo-100">
                            <TrendingUp className="h-6 w-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow border p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search payments..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>

                    <select
                        value={filters.paymentStatus}
                        onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Payments</option>
                        <option value="completed">Paid</option>
                        <option value="pending">Payment Pending</option>
                        <option value="failed">Payment Failed</option>
                        <option value="refunded">Refunded</option>
                    </select>

                    <select
                        value={filters.dateRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Time</option>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>

                    <button
                        onClick={() => setFilters({
                            status: 'all',
                            paymentStatus: 'all',
                            dateRange: '30',
                            search: ''
                        })}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow border">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Payment Transactions ({filteredPayments.length})
                    </h3>
                </div>

                {paginatedPayments.length === 0 ? (
                    <div className="p-8 text-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No payments found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Payment transactions from bookings will appear here
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Booking Reference
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Method
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {payment.bookingReference || 'N/A'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {payment.booking.seats} seat{payment.booking.seats > 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {payment.customer.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {payment.customer.email}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(payment.amount)}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {payment.currency}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                {payment.status.toUpperCase()}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                {payment.method.toUpperCase()}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(payment.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            Payment Data Source
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                This page displays payment information derived from booking data.
                                All financial transactions are tracked through the booking system,
                                including payment status, amounts, and customer information.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'} •
                Last updated: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

export default PaymentsPage;