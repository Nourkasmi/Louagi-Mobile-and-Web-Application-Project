// src/components/stations/StationQuickActions.js
import React from 'react';

const StationQuickActions = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Management</h3>
                <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">{stats.totalCapacity}</span> total slots available
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                        Optimize Capacity
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations</h3>
                <div className="space-y-3">
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                        Live Queue Status
                    </button>
                    <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                        Schedule Management
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports</h3>
                <div className="space-y-3">
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                        Usage Analytics
                    </button>
                    <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                        Performance Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StationQuickActions;