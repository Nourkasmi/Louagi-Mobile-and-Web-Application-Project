import { useState, useCallback } from 'react';
import { showToast } from '../utils/toast';

export const useTripCreation = () => {
    const [destinations, setDestinations] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Helper function for API calls
    const apiCall = useCallback(async (url, options = {}) => {
        const token = localStorage.getItem('louagi_token');
        const response = await fetch(`${API_BASE_URL}${url}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }, [API_BASE_URL]);

    // Fetch all required data for trip creation
    const fetchTripCreationData = useCallback(async () => {
        try {
            setLoading(true);

            const [destinationsRes, schedulesRes, driversRes] = await Promise.all([
                apiCall('/destinations'),
                apiCall('/schedules'),
                apiCall('/users?role=driver&is_verified=true&isActive=true&limit=100')
            ]);

            // Process destinations data
            if (destinationsRes.success) {
                setDestinations(destinationsRes.destinations || []);
            }

            // Process schedules data
            if (schedulesRes.success) {
                setSchedules(schedulesRes.schedules || []);
            }

            // Process drivers data
            if (driversRes.success) {
                const processedDrivers = driversRes.users
                    .filter(user => user.role === 'driver')
                    .map(user => {
                        const driver = user.driverProfile;
                        return {
                            id: user.driverProfile?.id || user.id,
                            name: user.username,
                            email: user.email,
                            vehicleType: driver?.vehicle_type || 'Unknown',
                            vehicleCapacity: driver?.vehicle_capacity || 4,
                            isActive: user.isActive,
                            isVerified: driver?.is_verified || false,
                            rating: driver?.rating || 0,
                            experience: driver?.experience || 0
                        };
                    })
                    .filter(driver => driver.isActive && driver.isVerified);

                setDrivers(processedDrivers);
            }

        } catch (error) {
            console.error('Error fetching trip creation data:', error);
            showToast('Failed to load trip creation data: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    // Create new trip
    const createTrip = async (tripData) => {
        try {
            setSubmitting(true);

            const requestData = {
                routeId: tripData.routeId,
                scheduleId: tripData.scheduleId,
                driverId: tripData.driverId,
                departureTime: new Date(tripData.departureTime).toISOString(),
                estimatedArrivalTime: new Date(tripData.estimatedArrivalTime).toISOString(),
                basePrice: parseFloat(tripData.basePrice),
                currentPrice: parseFloat(tripData.currentPrice),
                capacity: parseInt(tripData.capacity),
                notes: tripData.notes || '',
                status: tripData.status || 'scheduled'
            };

            console.log('🚀 Creating trip with data:', requestData);

            const response = await apiCall('/trips', {
                method: 'POST',
                body: JSON.stringify(requestData)
            });

            if (response.success) {
                showToast('Trip created successfully!', 'success');
                return { success: true, trip: response.trip };
            } else {
                throw new Error(response.message || 'Failed to create trip');
            }

        } catch (error) {
            console.error('Error creating trip:', error);
            showToast('Error creating trip: ' + error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            setSubmitting(false);
        }
    };

    // Update existing trip
    const updateTrip = async (tripId, tripData) => {
        try {
            setSubmitting(true);

            const requestData = {
                routeId: tripData.routeId,
                scheduleId: tripData.scheduleId,
                driverId: tripData.driverId,
                departureTime: new Date(tripData.departureTime).toISOString(),
                estimatedArrivalTime: new Date(tripData.estimatedArrivalTime).toISOString(),
                basePrice: parseFloat(tripData.basePrice),
                currentPrice: parseFloat(tripData.currentPrice),
                capacity: parseInt(tripData.capacity),
                notes: tripData.notes || '',
                status: tripData.status || 'scheduled'
            };

            console.log('🔄 Updating trip with data:', requestData);

            const response = await apiCall(`/trips/${tripId}`, {
                method: 'PUT',
                body: JSON.stringify(requestData)
            });

            if (response.success) {
                showToast('Trip updated successfully!', 'success');
                return { success: true, trip: response.trip };
            } else {
                throw new Error(response.message || 'Failed to update trip');
            }

        } catch (error) {
            console.error('Error updating trip:', error);
            showToast('Error updating trip: ' + error.message, 'error');
            return { success: false, error: error.message };
        } finally {
            setSubmitting(false);
        }
    };

    return {
        destinations,
        schedules,
        drivers,
        loading,
        submitting,
        fetchTripCreationData,
        createTrip,
        updateTrip,
    };
};
