// src/components/queue/QueueTable.js
import React from 'react';
import { Clock, ArrowUp, ArrowDown, Users, CheckCircle, XCircle } from 'lucide-react';

const QueueTable = ({
    queues,
    actionLoading,
    onMoveUp,
    onMoveDown,
    onMarkCalled,
    onMarkDone,
    onSkipDriver
}) => {
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
            case 'assigned': return <Users className="h-4 w-4" />;
            case 'skipped': return <XCircle className="h-4 w-4" />;
            case 'done': return <CheckCircle className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const calculateWaitTime = (joinedAt) => {
        if (!joinedAt) return 0;
        return Math.round((new Date() - new Date(joinedAt)) / (1000 * 60));
    };

    if (queues.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow border p-8">
                <div className="text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No drivers in queue
                    </h3>
                    <p className="text-gray-500">
                        Drivers will appear here when they declare availability for this route
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    Queue Status
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                    {queues.length} {queues.length === 1 ? 'driver' : 'drivers'} in queue
                </p>
            </div>

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
                        {queues.map((queueEntry) => {
                            const waitTime = calculateWaitTime(queueEntry.joinedAt || queueEntry.createdAt);
                            const isLoading = actionLoading[queueEntry.id];

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
                                            {queueEntry.driver?.user?.username || `Driver #${queueEntry.driverId?.slice(-8) || 'Unknown'}`}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            ID: {queueEntry.driverId?.slice(0, 8)}...
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
                                        {isLoading ? (
                                            <div className="flex items-center">
                                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                <span className="text-blue-600">Updating...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                {/* Actions for waiting drivers */}
                                                {queueEntry.status === 'waiting' && (
                                                    <>
                                                        <button
                                                            onClick={() => onMoveUp(queueEntry)}
                                                            disabled={queueEntry.position === 1}
                                                            className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed p-1 rounded hover:bg-blue-50"
                                                            title="Move Up"
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => onMoveDown(queueEntry)}
                                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                                                            title="Move Down"
                                                        >
                                                            <ArrowDown className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => onMarkCalled(queueEntry)}
                                                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                                                            title="Call Driver"
                                                        >
                                                            <Users className="h-4 w-4" />
                                                        </button>

                                                        <button
                                                            onClick={() => onSkipDriver(queueEntry)}
                                                            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50"
                                                            title="Skip Driver"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}

                                                {/* Actions for called drivers */}
                                                {queueEntry.status === 'called' && (
                                                    <button
                                                        onClick={() => onMarkDone(queueEntry)}
                                                        className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                                                        title="Mark as Done"
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </button>
                                                )}

                                                {/* No actions for done/skipped */}
                                                {['done', 'skipped'].includes(queueEntry.status) && (
                                                    <span className="text-gray-400 text-xs">No actions</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QueueTable;