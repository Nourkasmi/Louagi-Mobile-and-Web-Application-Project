// src/components/drivers/DriversErrorState.js
import React from 'react';
import { AlertCircle } from 'lucide-react';

const DriversErrorState = ({ error }) => {
    return (
        <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800">Error Loading Drivers</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriversErrorState;