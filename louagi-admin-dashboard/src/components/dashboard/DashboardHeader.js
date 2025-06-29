// src/components/dashboard/DashboardHeader.js
import React from 'react';
import { Bell, RefreshCw } from 'lucide-react';

const DashboardHeader = ({ onRefresh }) => (
    <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with Louagi today.</p>
        </div>
        <div className="flex items-center space-x-3">
            <button className="p-2 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors duration-200">
                <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button
                onClick={onRefresh}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
            </button>
        </div>
    </div>
);

export default DashboardHeader;