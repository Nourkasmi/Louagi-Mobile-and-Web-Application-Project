import { useState, useEffect, useCallback } from 'react';

export const usePayments = () => {
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: 'all',
        method: 'all',
        dateRange: '30'
    });
    const [refreshing, setRefreshing] = useState(false);

    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('louagi_token');
            const params = new URLSearchParams({
                page: currentPage,
                limit: 15,
                ...(searchTerm && { search: searchTerm }),
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.method !== 'all' && { method: filters.method }),
                ...(filters.dateRange !== 'all' && { days: filters.dateRange })
            });

            const response = await fetch(`/api/payments?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data.payments || []);
                setTotalPages(data.totalPages || 1);
            } else {
                setPayments([]);
                setTotalPages(1);
                console.error('Failed to fetch payments');
            }
        } catch (error) {
            setPayments([]);
            setTotalPages(1);
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm, filters]);

    const fetchPaymentStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('louagi_token');
            const response = await fetch('/api/payments/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.stats || {});
            } else {
                setStats({});
            }
        } catch (error) {
            setStats({});
            console.error('Error fetching payment stats:', error);
        }
    }, []);

    const refreshData = async () => {
        setRefreshing(true);
        await Promise.all([fetchPayments(), fetchPaymentStats()]);
        setRefreshing(false);
    };

    const exportPayments = async () => {
        try {
            const token = localStorage.getItem('louagi_token');
            const params = new URLSearchParams({
                ...(searchTerm && { search: searchTerm }),
                ...(filters.status !== 'all' && { status: filters.status }),
                ...(filters.method !== 'all' && { method: filters.method }),
                ...(filters.dateRange !== 'all' && { days: filters.dateRange }),
                export: 'csv'
            });

            const response = await fetch(`/api/payments/export?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                alert('Failed to export payments');
            }
        } catch (error) {
            alert('Error exporting payments');
        }
    };

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        Promise.all([fetchPayments(), fetchPaymentStats()])
            .then(() => isMounted && setLoading(false));
        return () => { isMounted = false; };
    }, [currentPage, searchTerm, filters, fetchPayments, fetchPaymentStats]);

    return {
        loading,
        payments,
        stats,
        currentPage,
        totalPages,
        searchTerm,
        filters,
        refreshing,
        setCurrentPage,
        setSearchTerm,
        setFilters,
        refreshData,
        exportPayments,
        fetchPayments,
        fetchPaymentStats
    };
};
