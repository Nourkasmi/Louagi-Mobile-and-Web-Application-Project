// src/hooks/useQueueStatus.js
import { useState, useEffect, useCallback } from 'react';

export const useQueueStatus = (stationId) => {
    const [queueCounts, setQueueCounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    const fetchQueueCounts = useCallback(async () => {
        if (!stationId) {
            setQueueCounts([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const response = await fetch(`${API_BASE_URL}/queues/count?stationId=${stationId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // No queues found for this station
                    setQueueCounts([]);
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setQueueCounts(data.queues || []);
            } else {
                throw new Error(data.message || 'Failed to fetch queue counts');
            }

        } catch (err) {
            console.error('Error fetching queue counts:', err);
            setError(err.message);
            setQueueCounts([]);
        } finally {
            setLoading(false);
        }
    }, [stationId, API_BASE_URL]);

    useEffect(() => {
        fetchQueueCounts();
    }, [fetchQueueCounts]);

    return {
        queueCounts,
        loading,
        error,
        refetchQueueCounts: fetchQueueCounts
    };
};