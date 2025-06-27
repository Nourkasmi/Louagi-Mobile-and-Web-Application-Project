export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

export const formatDate = (dateString, options = {}) => {
    if (!dateString) return 'N/A';
    try {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        return new Date(dateString).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    } catch {
        return 'Invalid Date';
    }
};

export const formatDateTime = (dateString, options = {}) => {
    if (!dateString) return 'N/A';
    try {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleString('en-US', { ...defaultOptions, ...options });
    } catch {
        return 'Invalid Date';
    }
};

export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};
