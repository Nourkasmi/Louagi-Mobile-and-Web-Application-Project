import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorState = ({ error, onRetry }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="p-6 space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                    <div>
                        <h3 className="text-lg font-medium text-red-800">Error Loading Users</h3>
                        <p className="text-red-700 mt-1">{error}</p>
                        <p className="text-sm text-red-600 mt-2">
                            Make sure your backend is running on {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                        </p>
                        <button
                            onClick={onRetry}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

export default ErrorState;