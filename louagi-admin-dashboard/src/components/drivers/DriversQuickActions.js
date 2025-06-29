// src/components/drivers/DriversQuickActions.js
import React from 'react';

const DriversQuickActions = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Queue Management */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Management</h3>
                <div className="space-y-3">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                        View Live Queue
                    </button>
                    <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                        Reorder Queue
                    </button>
                </div>
            </div>

            {/* Driver Verification */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Verification</h3>
                <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">5</span> pending verifications
                    </div>
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                        Review Pending
                    </button>
                </div>
            </div>

            {/* Performance Reports */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Reports</h3>
                <div className="space-y-3">
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                        Generate Report
                    </button>
                    <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
                        View Analytics
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriversQuickActions;