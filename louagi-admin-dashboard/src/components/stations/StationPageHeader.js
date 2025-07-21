import React from 'react';
import { Download, Plus, RefreshCw } from 'lucide-react';

const StationPageHeader = ({ onAddStation, onRefresh, onExport }) => {
    return (
        <div className="mb-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Stations Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage transportation stations, capacity, and operations
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={onExport}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                    <button
                        onClick={onAddStation}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Station
                    </button>
                    <button
                        onClick={onRefresh}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StationPageHeader;