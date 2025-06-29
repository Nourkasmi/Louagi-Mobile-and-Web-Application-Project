// src/components/common/Toast.js
import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5" />;
            case 'error': return <XCircle className="w-5 h-5" />;
            case 'warning': return <AlertCircle className="w-5 h-5" />;
            default: return <Info className="w-5 h-5" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            default: return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    return (
        <div className={`fixed top-4 right-4 p-4 rounded-lg border shadow-lg z-50 ${getColors()}`}>
            <div className="flex items-center">
                {getIcon()}
                <span className="ml-3">{message}</span>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-4 text-gray-400 hover:text-gray-600"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export const ToastContainer = ({ toasts = [] }) => {
    return (
        <div className="fixed top-4 right-4 space-y-2 z-50">
            {toasts.map((toast, index) => (
                <Toast key={index} {...toast} />
            ))}
        </div>
    );
};

export default Toast;