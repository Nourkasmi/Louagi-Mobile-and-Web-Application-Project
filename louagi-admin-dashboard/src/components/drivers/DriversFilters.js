// src/components/drivers/DriversFilters.js
import React from 'react';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';

const DriversFilters = ({ filters, setFilters, onRefresh, onExport }) => {
    return (
        <div className="bg-white rounded-lg shadow border p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search drivers..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Status</option>
                    <option value="waiting">Waiting</option>
                    <option value="on_trip">On Trip</option>
                    <option value="offline">Offline</option>
                </select>

                {/* Verification Filter */}
                <select
                    value={filters.verification}
                    onChange={(e) => setFilters(prev => ({ ...prev, verification: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">All Verification</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                </select>

                {/* More Filters Button */}
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                </button>
            </div>

            {/* Action Buttons Row */}
            <div className="flex justify-end space-x-3 mt-4">
                <button
                    onClick={onExport}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center"
                >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </button>
                <button
                    onClick={onRefresh}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>
        </div>
    );
};

export default DriversFilters;