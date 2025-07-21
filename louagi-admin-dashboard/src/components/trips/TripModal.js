import React, { useState, useEffect, useRef } from 'react';
import {
    Users,
    ArrowUpDown,
    BarChart3,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    X,
    Settings,
    MapPin,
    Calendar,
    Phone
} from 'lucide-react';

const LiveQueueModal = ({
    isOpen,
    onClose,
    queueData,
    onRefresh,
    refreshing = false
}) => {
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(30);
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const intervalRef = useRef(null);

    // Auto-refresh effect
    useEffect(() => {
        if (autoRefresh && isOpen && onRefresh) {
            intervalRef.current = setInterval(() => {
                onRefresh();
            }, refreshInterval * 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [autoRefresh, refreshInterval, isOpen, onRefresh]);

    // Helper functions
    const getStatusColor = (status) => {
        switch (status) {
            case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'called': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'assigned': return 'bg-green-100 text-green-800 border-green-200';
            case 'skipped': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'done': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'waiting': return <Clock className="h-4 w-4" />;
            case 'called': return <Users className="h-4 w-4" />;
            case 'assigned': return <CheckCircle className="h-4 w-4" />;
            case 'skipped': return <AlertCircle className="h-4 w-4" />;
            case 'done': return <CheckCircle className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const calculateWaitTime = (joinedAt) => {
        if (!joinedAt) return 0;
        return Math.round((new Date() - new Date(joinedAt)) / (1000 * 60));
    };

    const formatDriverName = (driver) => {
        if (driver?.user?.username) return driver.user.username;
        if (driver?.name) return driver.name;
        return `Driver #${driver?.id?.slice(-4) || 'Unknown'}`;
    };

    const formatDriverId = (driverId) => {
        if (!driverId) return 'Unknown';
        return driverId.slice(0, 8);
    };

    const handleDriverSelect = (driverId) => {
        setSelectedDrivers(prev =>
            prev.includes(driverId)
                ? prev.filter(id => id !== driverId)
                : [...prev, driverId]
        );
    };

    const handleSelectAll = () => {
        if (!queueData?.queues) return;
        if (selectedDrivers.length === queueData.queues.length) {
            setSelectedDrivers([]);
        } else {
            setSelectedDrivers(queueData.queues.map(q => q.driverId));
        }
    };

    const activeQueues = queueData?.queues || [];
    const hasQueueData = queueData && activeQueues.length > 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Live Queue Monitor</h2>
                                {queueData ? (
                                    <p className="text-blue-100 text-sm">
                                        {queueData.stationName} → {queueData.destinationName} • {activeQueues.length} driver{activeQueues.length !== 1 ? 's' : ''}
                                    </p>
                                ) : (
                                    <p className="text-blue-100 text-sm">Real-time queue monitoring</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <label className="flex items-center space-x-2 text-white text-sm">
                                <input
                                    type="checkbox"
                                    checked={autoRefresh}
                                    onChange={(e) => setAutoRefresh(e.target.checked)}
                                    className="rounded border-white/30 bg-white/20 text-blue-600 focus:ring-blue-500"
                                />
                                <span>Auto-refresh</span>
                            </label>
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                title="Settings"
                            >
                                <Settings className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={onRefresh}
                                disabled={refreshing}
                                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-5 h-5 text-white ${refreshing ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                title="Close"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                    {/* Settings Panel */}
                    {showSettings && (
                        <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-4">
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2 text-white text-sm">
                                    <span>Refresh every:</span>
                                    <select
                                        value={refreshInterval}
                                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                        className="bg-white bg-opacity-20 text-white rounded px-2 py-1 text-sm"
                                    >
                                        <option value={10}>10s</option>
                                        <option value={30}>30s</option>
                                        <option value={60}>1m</option>
                                        <option value={300}>5m</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Route Information */}
                {queueData && (
                    <div className="px-6 py-4 bg-gray-50 border-b flex-shrink-0">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center">
                                <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                                <div>
                                    <span className="font-medium text-gray-700">Station:</span>
                                    <p className="text-gray-900">{queueData.stationName}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-green-600 mr-2" />
                                <div>
                                    <span className="font-medium text-gray-700">Schedule:</span>
                                    <p className="text-gray-900">{queueData.scheduleTime}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <ArrowUpDown className="w-4 h-4 text-purple-600 mr-2" />
                                <div>
                                    <span className="font-medium text-gray-700">Destination:</span>
                                    <p className="text-gray-900">{queueData.destinationName}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Queue Statistics */}
                {hasQueueData && (
                    <div className="px-6 py-4 bg-gray-50 border-b flex-shrink-0">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {activeQueues.filter(q => q.status === 'waiting').length}
                                </div>
                                <div className="text-sm text-gray-600">Waiting</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {activeQueues.filter(q => q.status === 'assigned').length}
                                </div>
                                <div className="text-sm text-gray-600">Assigned</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {activeQueues.filter(q => q.status === 'done').length}
                                </div>
                                <div className="text-sm text-gray-600">Completed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {activeQueues.length > 0 ?
                                        Math.round(activeQueues.reduce((sum, q) => sum + calculateWaitTime(q.joinedAt), 0) / activeQueues.length)
                                        : 0}m
                                </div>
                                <div className="text-sm text-gray-600">Avg Wait</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Queue Table - SCROLLABLE! */}
                <div className="flex-1 overflow-y-auto">
                    {!hasQueueData ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-2">No drivers in queue</h3>
                                <p className="text-sm">
                                    {queueData ?
                                        'No drivers are currently waiting for this route' :
                                        'Select a station, schedule, and destination to view the queue'
                                    }
                                </p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedDrivers.length === activeQueues.length && activeQueues.length > 0}
                                            onChange={handleSelectAll}
                                            className="rounded"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wait Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {activeQueues.map((queue) => (
                                    <tr key={queue.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedDrivers.includes(queue.driverId)}
                                                onChange={() => handleDriverSelect(queue.driverId)}
                                                className="rounded"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-2xl font-bold text-blue-600">#{queue.position}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                    <Users className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {formatDriverName(queue.driver)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {formatDriverId(queue.driverId)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(queue.status)}`}>
                                                {getStatusIcon(queue.status)}
                                                <span className="ml-1 capitalize">{queue.status}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                <Clock className="w-4 h-4 text-gray-400 mr-1" />
                                                {calculateWaitTime(queue.joinedAt)} min
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {queue.driver?.user?.phone && (
                                                <div className="flex items-center">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {queue.driver.user.phone}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                {/* No interactive actions */}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveQueueModal;
