// src/pages/PaymentsPage.js
import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, DollarSign, CreditCard, ArrowDownRight, TrendingUp } from 'lucide-react';

const PaymentsPage = () => {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({
        totalRevenue: 125420.50,
        totalPayments: 1847,
        totalRefunds: 2340.25,
        netRevenue: 123080.25
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        method: 'all',
        dateRange: '30'
    });

    // Mock data for demonstration
    const mockPayments = [
        {
            id: 'pay_1234567890',
            booking: { bookingReference: 'LG-1234567' },
            customer: { name: 'John Doe', email: 'john@example.com' },
            amount: 45.50,
            currency: 'USD',
            status: 'completed',
            method: 'stripe',
            createdAt: new Date().toISOString()
        },
        {
            id: 'pay_1234567891',
            booking: { bookingReference: 'LG-1234568' },
            customer: { name: 'Jane Smith', email: 'jane@example.com' },
            amount: 67.00,
            currency: 'USD',
            status: 'pending',
            method: 'stripe',
            createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'pay_1234567892',
            booking: { bookingReference: 'LG-1234569' },
            customer: { name: 'Mike Johnson', email: 'mike@example.com' },
            amount: 32.75,
            currency: 'USD',
            status: 'failed',
            method: 'stripe',
            createdAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 'pay_1234567893',
            booking: { bookingReference: 'LG-1234570' },
            customer: { name: 'Sarah Wilson', email: 'sarah@example.com' },
            amount: 89.25,
            currency: 'USD',
            status: 'refunded',
            method: 'stripe_refund',
            createdAt: new Date(Date.now() - 259200000).toISOString()
        }
    ];

    useEffect(() => {
        // Simulate loading data
        const loadData = async () => {
            setLoading(true);
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            setPayments(mockPayments);
            setLoading(false);
        };

        loadData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-gray-100 text-gray-800';
            case 'refunded': return 'bg-purple-100 text-purple-800';
            case 'disputed': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getMethodBadge = (method) => {
        const colors = {
            stripe: 'bg-purple-100 text-purple-800',
            stripe_refund: 'bg-red-100 text-red-800',
            cash: 'bg-green-100 text-green-800',
            bank_transfer: 'bg-blue-100 text-blue-800'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[method] || 'bg-gray-100 text-gray-800'}`}>
                {method?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
            </span>
        );
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            payment.booking?.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filters.status === 'all' || payment.status === filters.status;
        const matchesMethod = filters.method === 'all' || payment.method === filters.method;
        
        return matchesSearch && matchesStatus && matchesMethod;
    });

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Payments Management</h1>
                        <p className="text-gray-600">Loading payments data...</p>
                    </div>
                </div>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading payments...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Payments Management</h1>
                    <p className="text-gray-600">Manage payments, refunds, and financial transactions</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
                            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                            <p className="text-xs text-green-600 mt-1">+12.5% from last month</p>
                        </div>
                        <div className="p-3 rounded-full bg-green-100">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Payments</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalPayments}</p>
                            <p className="text-xs text-green-600 mt-1">+8.2% from last month</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100">
                            <CreditCard className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Total Refunds</p>
                            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRefunds)}</p>
                            <p className="text-xs text-red-600 mt-1">-2.1% from last month</p>
                        </div>
                        <div className="p-3 rounded-full bg-purple-100">
                            <ArrowDownRight className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Net Revenue</p>
                            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.netRevenue)}</p>
                            <p className="text-xs text-green-600 mt-1">+15.3% from last month</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-100">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow border p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search payments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                        <option value="processing">Processing</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                        <option value="disputed">Disputed</option>
                    </select>

                    <select
                        value={filters.method}
                        onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Methods</option>
                        <option value="stripe">Stripe</option>
                        <option value="stripe_refund">Refund</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
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
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow border">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Payment Transactions ({filteredPayments.length})
                    </h3>
                </div>

                {filteredPayments.length === 0 ? (
                    <div className="p-8 text-center">
                        <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No payments found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Payment transactions will appear here when customers make bookings
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{payment.id?.slice(-8) || 'Unknown'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {payment.booking?.bookingReference || 'No reference'}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {payment.customer?.name || 'Unknown'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {payment.customer?.email || 'No email'}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(payment.amount)}
                                            </div>
                                            {payment.currency && payment.currency !== 'USD' && (
                                                <div className="text-sm text-gray-500">
                                                    {payment.currency}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                {payment.status?.toUpperCase() || 'UNKNOWN'}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getMethodBadge(payment.method)}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(payment.createdAt)}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">
                                                    View
                                                </button>
                                                {payment.status === 'completed' && (
                                                    <button className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">
                                                        Refund
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
            </div>
        </div>
    );
};

export default PaymentsPage;