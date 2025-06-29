// src/components/dashboard/SystemStatus.js
import React from 'react';

const SystemStatus = () => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">System Status</h3>
        <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-green-800">API Status</span>
                </div>
                <span className="text-xs text-green-600">Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-blue-800">Database</span>
                </div>
                <span className="text-xs text-blue-600">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-purple-800">Payments</span>
                </div>
                <span className="text-xs text-purple-600">Active</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="text-xs text-gray-600">Last backup</div>
                <div className="text-sm font-medium text-gray-900">2 hours ago</div>
            </div>
        </div>
    </div>
);

export default SystemStatus;