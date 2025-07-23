import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorDisplay = ({ error }) => {
    if (!error) return null;

    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
                <h3 className="text-sm font-medium text-red-800">Authentication Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
        </div>
    );
};

export default ErrorDisplay;