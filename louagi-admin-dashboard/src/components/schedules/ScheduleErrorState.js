// src/components/schedules/ScheduleErrorState.js
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ScheduleErrorState = ({ error, onRetry }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Schedules Management</h1>
                    <p className="mt-1 text-sm text-gray-600">Manage station schedules and operating hours</p>
                </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800">Error Loading Schedules</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                        <p className="text-xs text-red-600 mt-2">
                            Make sure your backend is running on {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                        </p>
                        <button
                            onClick={onRetry}
                            className="mt-3 inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleErrorState;