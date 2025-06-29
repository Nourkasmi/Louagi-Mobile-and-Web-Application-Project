// src/utils/paymentHelpers.js
import {
    CheckCircle,
    Clock,
    RefreshCw,
    XCircle,
    ArrowDownRight,
    AlertTriangle
} from 'lucide-react';

export const getStatusIcon = (status) => {
    switch (status) {
        case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
        case 'processing': return <RefreshCw className="h-4 w-4 text-blue-500" />;
        case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
        case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />;
        case 'refunded': return <ArrowDownRight className="h-4 w-4 text-purple-500" />;
        case 'disputed': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
        default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
};

export const getStatusColor = (status) => {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'processing': return 'bg-blue-100 text-blue-800';
        case 'failed': return 'bg-red-100 text-red-800';
        case 'cancelled': return 'bg-gray-100 text-gray-800';
        case 'refunded': return 'bg-purple-100 text-purple-800';
        case 'disputed': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};