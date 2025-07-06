// src/components/drivers/DriversQuickActions.js
import React from 'react';

const DriversQuickActions = () => {
    return (
        <div className="grid grid-cols-1 gap-6">
            {/* Driver Verification */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver Verification</h3>
                <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">5</span> pending verifications
                    </div>
                    <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                        Review Pending
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriversQuickActions;