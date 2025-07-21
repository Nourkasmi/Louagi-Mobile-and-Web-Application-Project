import React from 'react';
import { Search } from 'lucide-react';

const PaymentFilters = ({ searchTerm, setSearchTerm, filters, setFilters }) => (
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
);

export default PaymentFilters;