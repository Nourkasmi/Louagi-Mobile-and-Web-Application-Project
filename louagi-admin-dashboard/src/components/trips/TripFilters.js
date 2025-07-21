import React from 'react';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';

const TripFilters = ({
    filters,
    setFilters,
    onRefresh,
    onExport,
    refreshing
}) => {
    const handleClearFilters = () => {
        setFilters(prev => ({
            ...prev,
            search: '',
            status: '',
            page: 1
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filters & Actions</h3>
                <div className="flex space-x-3">
                    <button
                        onClick={onExport}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search trips..."
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
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>

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

export default TripFilters;
