// src/components/bookings/BookingFilters.js
import React, { useRef, useEffect, useState } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';

const BookingFilters = ({
    filters,
    setFilters,
    onRefresh,
    refreshing
}) => {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const debounceTimeout = useRef(null);

    // Keep local input value in sync if parent changes filters
    useEffect(() => {
        setSearchValue(filters.search || '');
    }, [filters.search]);

    // Debounce the search filter update
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        debounceTimeout.current = setTimeout(() => {
            // Only update if the value changed
            if (filters.search !== searchValue) {
                setFilters(prev => ({ ...prev, search: searchValue, page: 1 }));
            }
        }, 400); // 400ms debounce, adjust as you like

        return () => clearTimeout(debounceTimeout.current);
    }, [searchValue]);

    const handleClearFilters = () => {
        setFilters(prev => ({
            ...prev,
            search: '',
            status: '',
            paymentStatus: '',
            startDate: '',
            endDate: '',
            page: 1
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters & Actions</h3>
                <div className="flex space-x-3">
                    <button
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
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

                <button
                    onClick={handleClearFilters}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear
                </button>
            </div>
        </div>
    );
};

export default BookingFilters;
