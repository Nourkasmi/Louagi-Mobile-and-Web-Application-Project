import React from 'react';
import { Download, RefreshCw } from 'lucide-react';

const StationQuickActions = ({ stats, onExport, onRefresh }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export Data */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
                <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                        Download station data for external analysis
                    </div>
                    <button
                        onClick={onExport}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export Stations
                    </button>
                </div>
            </div>

            {/* System Actions */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Actions</h3>
                <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                        Refresh and sync station data
                    </div>
                    <button
                        onClick={onRefresh}
                        className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Data
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StationQuickActions;