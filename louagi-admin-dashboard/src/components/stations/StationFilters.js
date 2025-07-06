// src/components/stations/StationFilters.js - Updated with onRefresh support
import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw } from 'lucide-react';

const StationFilters = ({ filters, setFilters, onRefresh }) => {
    // Local search state to prevent immediate API calls
    const [localSearch, setLocalSearch] = useState(filters.search || '');

    // Update local search when external filters change (like clearing)
    useEffect(() => {
        setLocalSearch(filters.search || '');
    }, [filters.search]);

    // Debounced search function
    const debouncedSearch = useCallback(
        (() => {
            let timeoutId;
            return (searchValue) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    setFilters(prev => ({ 
                        ...prev, 
                        search: searchValue,
                        page: 1 // Reset to first page on search
                    }));
                }, 500); // 500ms delay after user stops typing
            };
        })(),
        [setFilters]
    );

    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setLocalSearch(value);
        debouncedSearch(value);
    };

    // Clear search
    const handleClearSearch = () => {
        setLocalSearch('');
        setFilters(prev => ({ 
            ...prev, 
            search: '',
            page: 1 
        }));
    };

    return (
        <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Search Stations</h3>
                <button
                    onClick={onRefresh}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </button>
            </div>

            {/* Search Bar Only */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Search stations by name, city, or address..."
                    value={localSearch}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                {localSearch && (
                    <button
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Clear search"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Search Status Indicator */}
            {localSearch !== filters.search && (
                <div className="mt-2 text-xs text-blue-600 flex items-center">
                    <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Searching...
                </div>
            )}

            {/* Search Results Info */}
            {filters.search && (
                <div className="mt-3 text-sm text-gray-600">
                    {filters.search && (
                        <span>
                            Searching for: <strong>"{filters.search}"</strong>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default StationFilters;