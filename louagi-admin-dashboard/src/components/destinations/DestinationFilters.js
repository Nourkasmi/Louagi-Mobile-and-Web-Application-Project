// src/components/destinations/DestinationFilters.js
import React from 'react';
import { Search } from 'lucide-react';

const DestinationFilters = ({
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    stations
}) => {
    return (
        <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search destinations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10"
                    />
                </div>

                {/* Status Filter */}
                <select
                    value={filters.isActive}
                    onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                    className="input-field"
                >
                    <option value="all">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>

                {/* Start Station Filter */}
                <select
                    value={filters.startStation}
                    onChange={(e) => setFilters(prev => ({ ...prev, startStation: e.target.value }))}
                    className="input-field"
                >
                    <option value="all">All Start Stations</option>
                    {stations.map(station => (
                        <option key={station.id} value={station.id}>
                            {station.name} - {station.city}
                        </option>
                    ))}
                </select>

                {/* End Station Filter */}
                <select
                    value={filters.endStation}
                    onChange={(e) => setFilters(prev => ({ ...prev, endStation: e.target.value }))}
                    className="input-field"
                >
                    <option value="all">All End Stations</option>
                    {stations.map(station => (
                        <option key={station.id} value={station.id}>
                            {station.name} - {station.city}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default DestinationFilters;