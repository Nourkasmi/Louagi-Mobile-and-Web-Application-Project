// src/components/login/SecurityNotice.js
import React from 'react';

const SecurityNotice = () => {
    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
                🔒 This is a secure admin portal. Only authorized personnel with admin privileges can access this system.
            </p>
        </div>
    );
};

export default SecurityNotice;