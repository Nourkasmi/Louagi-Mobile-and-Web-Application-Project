import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Clock, MapPin, Users, Car, ArrowUp, ArrowDown, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { usersAPI, tripsAPI } from '../services/api';

const QueuePage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [queues, setQueues] = useState([]);
    const [stations, setStations] = useState([]);
    const [destinations, setDestinations] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [selectedStation, setSelectedStation] = useState('');
    const [selectedSchedule, setSelectedSchedule] = useState('');
    const [selectedDestination, setSelectedDestination] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        station: 'all'
    });
    const [refreshing, setRefreshing] = useState(false);

    // Fetch initial data
    useEffect(() => {
        fetchInitialData();
    }, []);

    // Fetch queue data when filters change
    useEffect(() => {
        if (selectedStation && selectedSchedule && selectedDestination) {
            fetchQueueData();
        }
    }, [selectedStation, selectedSchedule, selectedDestination]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            // Fetch stations, destinations, and schedules
            const [stationsRes, destinationsRes, schedulesRes] = await Promise.all([
                fetch('/api/stations'),
                fetch('/api/destinations'),
                fetch('/api/schedules')
            ]);

            if (stationsRes.ok) {
                const stationsData = await stationsRes.json();
                setStations(stationsData.stations || []);
            }

            if (destinationsRes.ok) {
                const destinationsData = await destinationsRes.json();
                setDestinations(destinationsData.destinations || []);
            }

            if (schedulesRes.ok) {
                const schedulesData = await schedulesRes.json();
                setSchedules(schedulesData.schedules || []);
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchQueueData = async () => {
        try {
            setRefreshing(true);
            const token = localStorage.getItem('louagi_token');
            const response = await fetch(
                `/api/queues?stationId=${selectedStation}&scheduleId=${selectedSchedule}&destinationId=${selectedDestination}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setQueues(data.queue || []);
            } else {
                console.error('Failed to fetch queue data');
                setQueues([]);
            }
        } catch (error) {
            console.error('Error fetching queue data:', error);
            setQueues([]);
        } finally {
            setRefreshing(false);
        }
    };

    const updateQueueEntry = async (queueId, newPosition, newStatus) => {
        try {
            const token = localStorage.getItem('louagi_token');
            const response = await fetch(`/api/queues/${queueId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    position: newPosition,
                    status: newStatus
                })
            });

            if (response.ok) {
                // Refresh queue data
                fetchQueueData();
            } else {
                console.error('Failed to update queue entry');
            }
        } catch (error) {
            console.error('Error updating queue entry:', error);
        }
    };

    const moveDriverUp = (queueEntry) => {
        if (queueEntry.position > 1) {
            updateQueueEntry(queueEntry.id, queueEntry.position - 1, queueEntry.status);
        }
    };

    const moveDriverDown = (queueEntry) => {
        updateQueueEntry(queueEntry.id, queueEntry.position + 1, queueEntry.status);
    };

    const markDriverCalled = (queueEntry) => {
        updateQueueEntry(queueEntry.id, queueEntry.position, 'called');
    };

    const markDriverDone = (queueEntry) => {
        updateQueueEntry(queueEntry.id, queueEntry.position, 'done');
    };

    const skipDriver = (queueEntry) => {
        updateQueueEntry(queueEntry.id, queueEntry.position, 'skipped');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'waiting': return 'bg-yellow-100 text-yellow-800';
            case 'called': return 'bg-blue-100 text-blue-800';
            case 'assigned': return 'bg-green-100 text-green-800';
            case 'skipped': return 'bg-gray-100 text-gray-800';
            case 'done': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'waiting': return <Clock className="h-4 w-4" />;
            case 'called': return <Users className="h-4 w-4" />;
            case 'assigned': return <Car className="h-4 w-4" />;
            case 'skipped': return <XCircle className="h-4 w-4" />;
            case 'done': return <CheckCircle className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const filteredStations = stations.filter(station =>
        filters.station === 'all' || station.id === filters.station
    );

    const getSchedulesForStation = (stationId) => {
        return schedules.filter(schedule => schedule.stationId === stationId);
    };

    const getDestinationsForStation = (stationId) => {
        return destinations.filter(dest => dest.startId === stationId);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Queue Management" subtitle="Loading..." />
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="large" text="Loading queue data..." />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Queue Management"
                subtitle="Manage driver queues and waiting times"
                action={
                    <button
                        onClick={fetchQueueData}
                        disabled={!selectedStation || !selectedSchedule || !selectedDestination || refreshing}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                }
            />

            {/* Filters */}
            <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Station Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Station
                        </label>
                        <select
                            value={selectedStation}
                            onChange={(e) => {
                                setSelectedStation(e.target.value);
                                setSelectedSchedule('');
                                setSelectedDestination('');
                                setQueues([]);
                            }}
                            className="input-field"
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
                            onChange={(e) => {
                                setSelectedSchedule(e.target.value);
                                setSelectedDestination('');
                                setQueues([]);
                            }}
                            className="input-field"
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
                            onChange={(e) => {
                                setSelectedDestination(e.target.value);
                                setQueues([]);
                            }}
                            className="input-field"
                            disabled={!selectedStation}
                        >
                            <option value="">Select Destination</option>
                            {getDestinationsForStation(selectedStation).map(destination => (
                                <option key={destination.id} value={destination.id}>
                                    {destination.description || `To ${destination.endStation?.name}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status Filter
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="input-field"
                        >
                            <option value="all">All Statuses</option>
                            <option value="waiting">Waiting</option>
                            <option value="called">Called</option>
                            <option value="assigned">Assigned</option>
                            <option value="skipped">Skipped</option>
                            <option value="done">Done</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Queue Display */}
            {selectedStation && selectedSchedule && selectedDestination ? (
                <div className="card">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Queue Status
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {queues.length} drivers in queue
                        </p>
                    </div>

                    {queues.length === 0 ? (
                        <div className="p-8 text-center">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No drivers in queue</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Drivers will appear here when they declare availability
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Position
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Driver
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Wait Time
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {queues
                                        .filter(queue => filters.status === 'all' || queue.status === filters.status)
                                        .map((queueEntry) => {
                                            const waitTime = Math.round((new Date() - new Date(queueEntry.createdAt)) / (1000 * 60));

                                            return (
                                                <tr key={queueEntry.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span className="text-2xl font-bold text-blue-600">
                                                                #{queueEntry.position}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            Driver #{queueEntry.driverId.slice(-8)}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {queueEntry.driverId}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(queueEntry.status)}`}>
                                                            {getStatusIcon(queueEntry.status)}
                                                            <span className="ml-1 capitalize">{queueEntry.status}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div className="flex items-center">
                                                            <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                                            {waitTime} min{waitTime !== 1 ? 's' : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            {queueEntry.status === 'waiting' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => moveDriverUp(queueEntry)}
                                                                        disabled={queueEntry.position === 1}
                                                                        className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                                        title="Move Up"
                                                                    >
                                                                        <ArrowUp className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => moveDriverDown(queueEntry)}
                                                                        className="text-blue-600 hover:text-blue-900"
                                                                        title="Move Down"
                                                                    >
                                                                        <ArrowDown className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => markDriverCalled(queueEntry)}
                                                                        className="text-green-600 hover:text-green-900"
                                                                        title="Call Driver"
                                                                    >
                                                                        <Users className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => skipDriver(queueEntry)}
                                                                        className="text-gray-600 hover:text-gray-900"
                                                                        title="Skip Driver"
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {queueEntry.status === 'called' && (
                                                                <button
                                                                    onClick={() => markDriverDone(queueEntry)}
                                                                    className="text-purple-600 hover:text-purple-900"
                                                                    title="Mark as Done"
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="card p-8">
                    <div className="text-center">
                        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Select Queue to View
                        </h3>
                        <p className="text-gray-500">
                            Please select a station, schedule, and destination to view the queue
                        </p>
                    </div>
                </div>
            )}

            {/* Queue Statistics */}
            {queues.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="card p-6">
                        <div className="flex items-center">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                                <p className="text-2xl font-bold text-gray-900">{queues.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <div className="flex items-center">
                            <div className="p-2 rounded-lg bg-yellow-100">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Waiting</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {queues.filter(q => q.status === 'waiting').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <div className="flex items-center">
                            <div className="p-2 rounded-lg bg-green-100">
                                <Car className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Assigned</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {queues.filter(q => q.status === 'assigned').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <div className="flex items-center">
                            <div className="p-2 rounded-lg bg-purple-100">
                                <CheckCircle className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Average Wait</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {queues.length > 0
                                        ? Math.round(queues.reduce((sum, q) =>
                                            sum + (new Date() - new Date(q.createdAt)) / (1000 * 60), 0
                                        ) / queues.length)
                                        : 0}m
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QueuePage;