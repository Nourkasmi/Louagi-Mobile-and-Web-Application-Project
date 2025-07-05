// src/components/stations/QueueStatus.js
import React from 'react';
import { Users, Clock, MapPin } from 'lucide-react';
import { useQueueStatus } from '../../hooks/useQueueStatus';

const QueueStatus = ({ station }) => {
    const { queueCounts, loading, error } = useQueueStatus(station.id);

    if (loading) {
        return (
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Loading queue status...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-600">
                    Failed to load queue status
                </div>
            </div>
        );
    }

    if (!queueCounts || queueCounts.length === 0) {
        return (
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">No active queues</span>
                </div>
            </div>
        );
    }

    const totalDriversInQueue = queueCounts.reduce((sum, queue) => sum + queue.count, 0);

    return (
        <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-blue-600" />
                    Queue Status
                </h4>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {totalDriversInQueue} drivers waiting
                </span>
            </div>

            <div className="space-y-2">
                {queueCounts.map((queue) => (
                    <div key={queue.destinationId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center space-x-2">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-700">
                                {queue.description || `Destination ${queue.destinationId}`}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                queue.count > 0 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                            }`}>
                                {queue.count} {queue.count === 1 ? 'driver' : 'drivers'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {totalDriversInQueue > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 text-center">
                        Total: {totalDriversInQueue} drivers across {queueCounts.length} destinations
                    </div>
                </div>
            )}
        </div>
    );
};

export default QueueStatus;