import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorDisplay = ({
    error,
    onRetry,
    title = "Error",
    showRetry = true
}) => {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                <div className="flex-1">
                    <h3 className="text-lg font-medium text-red-800">{title}</h3>
                    <p className="text-red-700 mt-1">{error}</p>
                    <p className="text-sm text-red-600 mt-2">
                        Make sure your backend is running and accessible.
                    </p>
                    {showRetry && onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Retry
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ErrorDisplay;