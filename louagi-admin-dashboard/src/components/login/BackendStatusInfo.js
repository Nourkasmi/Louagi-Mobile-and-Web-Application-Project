import React from 'react';
import { Wifi } from 'lucide-react';

const BackendStatusInfo = () => {
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
                <Wifi className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-800">Backend Connection</h3>
            </div>
            <p className="text-sm text-blue-700">
                Email: admin@louagi.tn<br />
                Password: SecureAdmin@123
            </p>
            <p className="text-xs text-blue-600 mt-2">
                ⚠️ Ensure backend is running on http://localhost:5000
            </p>
        </div>
    );
};

export default BackendStatusInfo;