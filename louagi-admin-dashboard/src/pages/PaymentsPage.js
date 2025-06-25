import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import {
    CreditCard,
    Search,
    Filter,
    DollarSign,
    TrendingUp,
    RefreshCw,
    Download,
    Eye,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    User,
    Receipt
} from 'lucide-react';

const PaymentsPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        method: 'all',
        dateRange: '30'
    });
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState('requested_by_customer');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchPayments();
        fetchPaymentStats();
    }, [currentPage, searchTerm, filters]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('louagi_token');
            const params = new URLSearchParams({
                page: currentPage,
                limit: 15,
                ...(searchTerm && { search: searchTerm }),
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.method !== 'all' && { method: filters.method }),
                ...(filters.dateRange !== 'all' && { days: filters.dateRange })
            });

            const response = await fetch(`/api/payments?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data.payments || []);
                setTotalPages(data.totalPages || 1);
            } else {
                console.error('Failed to fetch payments');
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentStats = async () => {
        try {
            const token = localStorage.getItem('louagi_token');
            const response = await fetch('/api/payments/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.stats || {});
            }
        } catch (error) {
            console.error('Error fetching payment stats:', error);
        }
    };

    const handleRefund = async () => {
        if (!selectedPayment) return;

        try {
            const token = localStorage.getItem('louagi_token');
            const response = await fetch(`/api/payments/${selectedPayment.id}/refund`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: refundAmount ? parseFloat(refundAmount) : undefined,
                    reason: refundReason
                })
            });

            if (response.ok) {
                setShowRefundModal(false);
                setSelectedPayment(null);
                setRefundAmount('');
                setRefundReason('requested_by_customer');
                fetchPayments();
                fetchPaymentStats();
                alert('Refund processed successfully');
            } else {
                const errorData = await response.json();
                alert(`Refund failed: ${errorData.message}`);
            }
        } catch (error) {
            alert('Error processing refund');
        }
    };

    const openRefundModal = (payment) => {
        setSelectedPayment(payment);
        setRefundAmount(payment.amount.toString());
        setShowRefundModal(true);
    };

    const refreshData = async () => {
        setRefreshing(true);
        await Promise.all([fetchPayments(), fetchPaymentStats()]);
        setRefreshing(false);
    };

    const exportPayments = async () => {
        try {
            const token = localStorage.getItem('louagi_token');
            const params = new URLSearchParams({
                ...(searchTerm && { search: searchTerm }),
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.method !== 'all' && { method: filters.method }),
                ...(filters.dateRange !== 'all' && { days: filters.dateRange }),
                export: 'csv'
            });

            const response = await fetch(`/api/payments/export?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Failed to export payments');
            }
        } catch (error) {
            alert('Error exporting payments');
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500" />;
            case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
            case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />;
            case 'refunded': return <ArrowDownRight className="h-4 w-4 text-purple-500" />;
            case 'disputed': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            default: return <Clock className="h-4 w-4 text-gray-400" />;
        }
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

    if (loading && payments.length === 0) {
        return (
            <div className="space-y-6">
                <PageHeader title="Payments Management" subtitle="Loading..." />
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="large" text="Loading payments..." />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Payments Management"
                subtitle="Manage payments, refunds, and financial transactions"
                action={
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={exportPayments}
                            className="btn-secondary flex items-center space-x-2"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                        </button>
                        <button
                            onClick={refreshData}
                            disabled={refreshing}
                            className="btn-primary flex items-center space-x-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                }
            />

            {/* Payment Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Revenue"
                    value={formatCurrency(stats.totalRevenue || 0)}
                    change="+12.5%"
                    changeType="positive"
                    icon={DollarSign}
                    color="green"
                />
                <StatCard
                    title="Total Payments"
                    value={stats.total || 0}
                    change="+8.2%"
                    changeType="positive"
                    icon={CreditCard}
                    color="blue"
                />
                <StatCard
                    title="Total Refunds"
                    value={formatCurrency(stats.totalRefunds || 0)}
                    change="-2.1%"
                    changeType="negative"
                    icon={ArrowDownRight}
                    color="purple"
                />
                <StatCard
                    title="Net Revenue"
                    value={formatCurrency(stats.netRevenue || 0)}
                    change="+15.3%"
                    changeType="positive"
                    icon={TrendingUp}
                    color="primary"
                />
            </div>

            {/* Search and Filters */}
            <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search payments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="input-field"
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

                    {/* Method Filter */}
                    <select
                        value={filters.method}
                        onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value }))}
                        className="input-field"
                    >
                        <option value="all">All Methods</option>
                        <option value="stripe">Stripe</option>
                        <option value="stripe_refund">Refund</option>
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                    </select>

                    {/* Date Range Filter */}
                    <select
                        value={filters.dateRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                        className="input-field"
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
            <div className="card">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Payment Transactions ({payments.length})
                    </h3>
                </div>

                {payments.length === 0 ? (
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
                                {payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                        {payment.paymentMethod === 'stripe_refund' ? (
                                                            <ArrowDownRight className="h-5 w-5 text-purple-600" />
                                                        ) : (
                                                            <CreditCard className="h-5 w-5 text-blue-600" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        Payment #{payment.id.slice(-8)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        Booking: {payment.booking?.id?.slice(-8) || 'N/A'}
                                                    </div>
                                                    {payment.processingFee && (
                                                        <div className="text-xs text-gray-400">
                                                            Fee: {formatCurrency(payment.processingFee)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {payment.booking?.passenger?.user?.username || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {payment.booking?.passenger?.user?.email || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(Math.abs(payment.amount))}
                                            </div>
                                            {payment.netAmount && (
                                                <div className="text-xs text-gray-500">
                                                    Net: {formatCurrency(payment.netAmount)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                {getStatusIcon(payment.status)}
                                                <span className="ml-1 capitalize">{payment.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                {payment.paymentMethod === 'stripe' && (
                                                    <CreditCard className="h-4 w-4 text-blue-500 mr-1" />
                                                )}
                                                {payment.paymentMethod === 'stripe_refund' && (
                                                    <ArrowDownRight className="h-4 w-4 text-purple-500 mr-1" />
                                                )}
                                                <span className="capitalize">
                                                    {payment.paymentMethod.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                                {formatDate(payment.createdAt)}
                                            </div>
                                            {payment.paidAt && payment.paidAt !== payment.createdAt && (
                                                <div className="text-xs text-gray-400">
                                                    Paid: {formatDate(payment.paidAt)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => {/* View payment details */ }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {payment.status === 'completed' && payment.paymentMethod !== 'stripe_refund' && (
                                                    <button
                                                        onClick={() => openRefundModal(payment)}
                                                        className="text-purple-600 hover:text-purple-900"
                                                        title="Process Refund"
                                                    >
                                                        <ArrowDownRight className="h-4 w-4" />
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
                {totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Refund Modal */}
            {showRefundModal && selectedPayment && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Process Refund
                            </h3>

                            <div className="space-y-4">
                                {/* Payment Details */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600">Original Payment</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {formatCurrency(selectedPayment.amount)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Payment #{selectedPayment.id.slice(-8)}
                                    </div>
                                </div>

                                {/* Refund Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Refund Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        max={selectedPayment.amount}
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        className="input-field"
                                        placeholder="Enter refund amount"
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                        Maximum: {formatCurrency(selectedPayment.amount)}
                                    </div>
                                </div>

                                {/* Refund Reason */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Refund Reason
                                    </label>
                                    <select
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="requested_by_customer">Requested by Customer</option>
                                        <option value="duplicate">Duplicate Payment</option>
                                        <option value="fraudulent">Fraudulent Transaction</option>
                                        <option value="expired_uncaptured_charge">Expired Uncaptured Charge</option>
                                    </select>
                                </div>

                                {/* Warning */}
                                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                    <div className="flex">
                                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                        <div className="ml-3">
                                            <p className="text-sm text-yellow-700">
                                                This action cannot be undone. The refund will be processed immediately.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowRefundModal(false);
                                        setSelectedPayment(null);
                                        setRefundAmount('');
                                        setRefundReason('requested_by_customer');
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRefund}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                                >
                                    <ArrowDownRight className="h-4 w-4" />
                                    <span>Process Refund</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsPage;