import { Shield, Car, User } from 'lucide-react';

export const getRoleIcon = (role) => {
    switch (role) {
        case 'admin': return <Shield className="w-4 h-4" />;
        case 'driver': return <Car className="w-4 h-4" />;
        case 'passenger': return <User className="w-4 h-4" />;
        default: return <User className="w-4 h-4" />;
    }
};

export const getRoleColor = (role) => {
    switch (role) {
        case 'admin': return 'text-purple-700 bg-purple-100 border-purple-200';
        case 'driver': return 'text-blue-700 bg-blue-100 border-blue-200';
        case 'passenger': return 'text-green-700 bg-green-100 border-green-200';
        default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
};

export const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Invalid Date';
    }
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return 'Invalid Date';
    }
};
