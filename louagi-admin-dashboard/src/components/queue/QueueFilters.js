import React from 'react';
import { RefreshCw } from 'lucide-react';

const QueueFilters = ({
    stations,
    schedules,
    destinations,
    selectedStation,
    selectedSchedule,
    selectedDestination,
    onStationChange,
    onScheduleChange,
    onDestinationChange,
    onRefresh,
    refreshing,
    getSchedulesForStation,
    getDestinationsForStation
}) => {
    return (
        <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Queue Filters</h3>
                <button
                    onClick={onRefresh}
                    disabled={!selectedStation || !selectedSchedule || !selectedDestination || refreshing}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Station Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Station
                    </label>
                    <select
                        value={selectedStation}
                        onChange={(e) => onStationChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select Station</option>
                        {stations.map(station => (
                            <option key={station.id} value={station.id}>
                                {station.name} - {station.city}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Schedule Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Schedule
                    </label>
                    <select
                        value={selectedSchedule}
                        onChange={(e) => onScheduleChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!selectedStation}
                    >
                        <option value="">Select Schedule</option>
                        {getSchedulesForStation(selectedStation).map(schedule => (
                            <option key={schedule.id} value={schedule.id}>
                                Day {schedule.dayOfWeek}: {schedule.startTime} - {schedule.endTime}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Destination Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destination
                    </label>
                    <select
                        value={selectedDestination}
                        onChange={(e) => onDestinationChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!selectedStation}
                    >
                        <option value="">Select Destination</option>
                        {getDestinationsForStation(selectedStation).map(destination => (
                            <option key={destination.id} value={destination.id}>
                                {destination.description || `To ${destination.endStation?.name || 'Unknown'}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Selection Summary */}
            {selectedStation && selectedSchedule && selectedDestination && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                        <span className="font-medium">Selected Queue:</span> {' '}
                        {stations.find(s => s.id === selectedStation)?.name} → {' '}
                        {destinations.find(d => d.id === selectedDestination)?.description}
                        {' '}({schedules.find(s => s.id === selectedSchedule)?.startTime} - {schedules.find(s => s.id === selectedSchedule)?.endTime})
                    </p>
                </div>
            )}
        </div>
    );
};

export default QueueFilters;
