import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import PageHeader from '../common/PageHeader';

const DashboardError = ({ error, onRetry }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-6 space-y-6">
            <PageHeader
                title="Dashboard"
                subtitle="Welcome to Louagi Admin Dashboard"
            />
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800">Dashboard Error</h3>
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
    </div>
);

export default DashboardError;