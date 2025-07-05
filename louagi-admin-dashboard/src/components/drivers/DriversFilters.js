// src/components/drivers/DriversFilters.js
import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';

const DriversFilters = ({ filters, setFilters, onRefresh }) => {
    // Local state for the search input to prevent immediate API calls
    const [localSearch, setLocalSearch] = useState(filters.search || '');

    // Debounce the search - only update the actual filter after user stops typing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            // Only update if the value actually changed
            if (localSearch !== filters.search) {
                setFilters(prev => ({ 
                    ...prev, 
                    search: localSearch,
                    page: 1 // Reset to first page when searching
                }));
            }
        }, 500); // Wait 500ms after user stops typing

        // Cleanup timeout if user types again
        return () => clearTimeout(timeoutId);
    }, [localSearch, setFilters, filters.search]);

    // Sync local search with external filter changes (like clearing)
    useEffect(() => {
        if (filters.search !== localSearch) {
            setLocalSearch(filters.search || '');
        }
    }, [filters.search]);

    const handleSearchChange = (e) => {
        setLocalSearch(e.target.value);
    };

    const handleSearchClear = () => {
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
                <h3 className="text-lg font-semibold text-gray-900">Search & Actions</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Input with Clear Button */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search drivers..."
                        value={localSearch}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {localSearch && (
                        <button
                            onClick={handleSearchClear}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title="Clear search"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    {localSearch !== filters.search && (
                        <div className="absolute -bottom-6 left-0 text-xs text-blue-600">
                            Searching...
                        </div>
                    )}
                </div>

                {/* Refresh Button */}
                <div className="flex justify-end">
                    <button
                        onClick={onRefresh}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriversFilters;