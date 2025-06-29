// src/components/drivers/DriversLoadingState.js
import React from 'react';

const DriversLoadingState = () => {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading drivers...</p>
                {/* Connection Status */}
                <div className="text-xs text-gray-500 mt-4">
                    ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'} •
                    Last updated: {new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};

export default DriversLoadingState;