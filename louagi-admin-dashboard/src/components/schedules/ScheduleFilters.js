// src/components/schedules/ScheduleFilters.js
import React from 'react';

const ScheduleFilters = ({ filters, stations, daysOfWeek, onFilterChange }) => {
    const handleChange = (key, value) => {
        onFilterChange(key, value);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <input
                        type="text"
                        placeholder="Search schedules..."
                        value={filters.search}
                        onChange={(e) => handleChange('search', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <select
                        value={filters.stationId}
                        onChange={(e) => handleChange('stationId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Stations</option>
                        {stations.map(station => (
                            <option key={station.id} value={station.id}>
                                {station.name} - {station.city}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <select
                        value={filters.dayOfWeek}
                        onChange={(e) => handleChange('dayOfWeek', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Days</option>
                        {daysOfWeek.map(day => (
                            <option key={day.value} value={day.value}>
                                {day.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <select
                        value={filters.isActive}
                        onChange={(e) => handleChange('isActive', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ScheduleFilters;