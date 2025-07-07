// src/components/queue/QueueQuickActions.js
import React from 'react';
import { Users, ArrowUpDown, RefreshCw } from 'lucide-react';

const QueueQuickActions = ({ 
    onViewLiveQueue, 
    onReorderQueue, 
    onRefreshAll,
    hasActiveQueue = false 
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Live Queue Management */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Queue</h3>
                <div className="space-y-3">
                    <button 
                        onClick={onViewLiveQueue}
                        disabled={!hasActiveQueue}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        View Live Queue
                    </button>
                    <div className="text-xs text-gray-500 text-center">
                        {hasActiveQueue ? 'Queue is active' : 'Select filters to view queue'}
                    </div>
                </div>
            </div>

            {/* Queue Reordering */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Control</h3>
                <div className="space-y-3">
                    <button 
                        onClick={onReorderQueue}
                        disabled={!hasActiveQueue}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        Reorder Queue
                    </button>
                    <div className="text-xs text-gray-500 text-center">
                        Manage driver positions
                    </div>
                </div>
            </div>

            {/* System Refresh */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Control</h3>
                <div className="space-y-3">
                    <button 
                        onClick={onRefreshAll}
                        className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh All
                    </button>
                    <div className="text-xs text-gray-500 text-center">
                        Update all queue data
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueueQuickActions;
