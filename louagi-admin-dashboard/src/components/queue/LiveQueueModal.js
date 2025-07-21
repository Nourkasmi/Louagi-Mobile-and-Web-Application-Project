import React, { useState, useEffect, useRef } from 'react';
import {
    Users,
    ArrowUpDown,
    BarChart3,
    RefreshCw,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle,
    X,
    Eye,
    Settings
} from 'lucide-react';

// Mock data for when no real data is available
const getMockQueueData = () => ({
    stationName: "Central Station",
    scheduleTime: "08:00 - 18:00",
    destinationName: "Downtown Terminal",
    queues: [
        {
            id: "mock-q1",
            driverId: "mock-d1",
            position: 1,
            status: "waiting",
            joinedAt: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
            driver: { user: { username: "Ahmed Hassan" } }
        },
        {
            id: "mock-q2",
            driverId: "mock-d2",
            position: 2,
            status: "waiting",
            joinedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
            driver: { user: { username: "Mohamed Ali" } }
        },
        {
            id: "mock-q3",
            driverId: "mock-d3",
            position: 3,
            status: "assigned",
            joinedAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
            driver: { user: { username: "Fatima Zahra" } }
        },
        {
            id: "mock-q4",
            driverId: "mock-d4",
            position: 4,
            status: "waiting",
            joinedAt: new Date(Date.now() - 8 * 60 * 1000), // 8 minutes ago
            driver: { user: { username: "Youssef Ben Ali" } }
        }
    ]
});

const LiveQueueModal = ({
    isOpen,
    onClose,
    queueData,
    onRefresh,
    refreshing = false
}) => {
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(30); // seconds
    const [selectedDrivers, setSelectedDrivers] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const intervalRef = useRef(null);

    // Use mock data if no real data is provided
    const activeQueueData = queueData || getMockQueueData();

    // Auto-refresh effect
    useEffect(() => {
        if (autoRefresh && isOpen && onRefresh) {
            intervalRef.current = setInterval(() => {
                onRefresh();
            }, refreshInterval * 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoRefresh, refreshInterval, isOpen, onRefresh]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

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

    const handleDriverSelect = (driverId) => {
        setSelectedDrivers(prev =>
            prev.includes(driverId)
                ? prev.filter(id => id !== driverId)
                : [...prev, driverId]
        );
    };

    const handleBulkAction = (action) => {
        if (selectedDrivers.length === 0) {
            alert('Please select drivers first');
            return;
        }

        // Handle bulk actions
        switch (action) {
            case 'call':
                alert(`Calling ${selectedDrivers.length} drivers`);
                break;
            case 'skip':
                alert(`Skipping ${selectedDrivers.length} drivers`);
                break;
            case 'reorder':
                alert(`Reordering ${selectedDrivers.length} drivers`);
                break;
            default:
                break;
        }

        setSelectedDrivers([]);
    };

    const handleSelectAll = () => {
        if (selectedDrivers.length === activeQueueData.queues.length) {
            setSelectedDrivers([]);
        } else {
            setSelectedDrivers(activeQueueData.queues.map(q => q.driverId));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Live Queue Monitor</h2>
                                <p className="text-blue-100 text-sm">
                                    {activeQueueData.stationName} → {activeQueueData.destinationName} • {activeQueueData.queues?.length || 0} drivers
                                </p>
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

                {/* Queue Statistics */}
                <div className="px-6 py-4 bg-gray-50 border-b flex-shrink-0">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {activeQueueData.queues?.filter(q => q.status === 'waiting').length || 0}
                            </div>
                            <div className="text-sm text-gray-600">Waiting</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {activeQueueData.queues?.filter(q => q.status === 'assigned').length || 0}
                            </div>
                            <div className="text-sm text-gray-600">Assigned</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {activeQueueData.queues?.filter(q => q.status === 'done').length || 0}
                            </div>
                            <div className="text-sm text-gray-600">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {activeQueueData.queues?.length > 0 ?
                                    Math.round(activeQueueData.queues.reduce((sum, q) => sum + calculateWaitTime(q.joinedAt), 0) / activeQueueData.queues.length)
                                    : 0}m
                            </div>
                            <div className="text-sm text-gray-600">Avg Wait</div>
                        </div>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedDrivers.length > 0 && (
                    <div className="px-6 py-3 bg-blue-50 border-b flex items-center justify-between flex-shrink-0">
                        <span className="text-sm text-blue-800">
                            {selectedDrivers.length} driver(s) selected
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handleBulkAction('call')}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                                Call Selected
                            </button>
                            <button
                                onClick={() => handleBulkAction('skip')}
                                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                            >
                                Skip Selected
                            </button>
                            <button
                                onClick={() => handleBulkAction('reorder')}
                                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                            >
                                Reorder
                            </button>
                        </div>
                    </div>
                )}

                {/* Queue Table */}
                <div className="flex-1 overflow-auto">
                    {!activeQueueData.queues?.length ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-2">No drivers in queue</h3>
                                <p className="text-sm">Drivers will appear here when they join the queue</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedDrivers.length === activeQueueData.queues.length}
                                            onChange={handleSelectAll}
                                            className="rounded"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wait Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {activeQueueData.queues.map((queue) => (
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
                                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                                    <Users className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {queue.driver?.user?.username || `Driver #${queue.driverId?.slice(-4)}`}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {queue.driverId?.slice(0, 8)}...
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                {queue.status === 'waiting' && (
                                                    <>
                                                        <button
                                                            onClick={() => alert(`Calling ${queue.driver?.user?.username}`)}
                                                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                                            title="Call Driver"
                                                        >
                                                            <Users className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => alert(`Moving up ${queue.driver?.user?.username}`)}
                                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                            title="Move Up"
                                                        >
                                                            <ArrowUpDown className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => alert(`Viewing details for ${queue.driver?.user?.username}`)}
                                                    className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between flex-shrink-0">
                    <div className="text-sm text-gray-600">
                        Last updated: {new Date().toLocaleTimeString()}
                        {autoRefresh && (
                            <span className="ml-2 text-green-600">
                                • Auto-refreshing every {refreshInterval}s
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => alert('Opening queue analytics')}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analytics
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveQueueModal;