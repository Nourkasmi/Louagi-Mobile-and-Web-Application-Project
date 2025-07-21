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

            console.log('🔄 Fetching trip creation data...');

            // Fetch data in parallel
            const [destinationsRes, schedulesRes, driversRes] = await Promise.all([
                apiCall('/destinations'),
                apiCall('/schedules'),
                // ✅ FIX: Get all drivers without filtering by verification status in the API call
                apiCall('/users?role=driver&limit=100')
            ]);

            // Process destinations data
            if (destinationsRes.success) {
                console.log('📍 Destinations loaded:', destinationsRes.destinations?.length || 0);
                setDestinations(destinationsRes.destinations || []);
            }

            // Process schedules data
            if (schedulesRes.success) {
                console.log('📅 Schedules loaded:', schedulesRes.schedules?.length || 0);
                setSchedules(schedulesRes.schedules || []);
            }

            // ✅ FIX: Improved driver data processing
            if (driversRes.success) {
                console.log('👥 Raw driver users:', driversRes.users?.length || 0);

                // Process all driver users and create enhanced driver objects
                const processedDrivers = driversRes.users
                    .filter(user => {
                        // Only include users with driver role
                        const isDriver = user.role === 'driver';
                        if (!isDriver) {
                            console.log('⚠️ Skipping non-driver user:', user.username);
                        }
                        return isDriver;
                    })
                    .map(user => {
                        const driverProfile = user.driverProfile || {};

                        // Create comprehensive driver object
                        const processedDriver = {
                            // ✅ FIX: Use the user ID, not the driver profile ID
                            id: user.id,
                            driverId: user.id,

                            // Basic info
                            name: user.username || 'Unknown Driver',
                            email: user.email || '',
                            phone: user.phone || '',

                            // Driver specific info
                            licenseNo: driverProfile.license_no || 'N/A',
                            vehicleType: driverProfile.vehicle_type || 'Standard',
                            vehicleCapacity: driverProfile.vehicle_capacity || 4,

                            // Status info
                            isActive: user.isActive || false,
                            isVerified: driverProfile.is_verified || false,

                            // Additional info
                            rating: driverProfile.rating || 0,
                            experience: driverProfile.experience || 0,
                            licenseExpiry: driverProfile.license_expiry || null,

                            // For debugging
                            _userId: user.id,
                            _hasDriverProfile: !!user.driverProfile
                        };

                        console.log('👤 Processed driver:', processedDriver.name, {
                            id: processedDriver.id,
                            isActive: processedDriver.isActive,
                            isVerified: processedDriver.isVerified,
                            vehicleType: processedDriver.vehicleType
                        });

                        return processedDriver;
                    })
                    // ✅ FIX: Filter for available drivers but include unverified ones
                    .filter(driver => {
                        // Only exclude inactive drivers
                        const isAvailable = driver.isActive;
                        if (!isAvailable) {
                            console.log('⚠️ Skipping inactive driver:', driver.name);
                        }
                        return isAvailable;
                    })
                    // Sort by verification status and name
                    .sort((a, b) => {
                        // Verified drivers first
                        if (a.isVerified && !b.isVerified) return -1;
                        if (!a.isVerified && b.isVerified) return 1;
                        // Then by name
                        return a.name.localeCompare(b.name);
                    });

                console.log('✅ Final processed drivers:', processedDrivers.length);
                console.log('📊 Driver breakdown:', {
                    total: processedDrivers.length,
                    verified: processedDrivers.filter(d => d.isVerified).length,
                    unverified: processedDrivers.filter(d => !d.isVerified).length,
                    active: processedDrivers.filter(d => d.isActive).length
                });

                setDrivers(processedDrivers);
            } else {
                console.warn('⚠️ No drivers data received');
                setDrivers([]);
            }

        } catch (error) {
            console.error('❌ Error fetching trip creation data:', error);
            showToast('Failed to load trip creation data: ' + error.message, 'error');

            // Set empty arrays on error
            setDestinations([]);
            setSchedules([]);
            setDrivers([]);
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    // Create new trip
    const createTrip = async (tripData) => {
        try {
            setSubmitting(true);

            // ✅ FIX: Validate required fields
            if (!tripData.driverId) {
                throw new Error('Please select a driver');
            }

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
            console.error('❌ Error creating trip:', error);
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

            // ✅ FIX: Validate required fields
            if (!tripData.driverId) {
                throw new Error('Please select a driver');
            }

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
            console.error('❌ Error updating trip:', error);
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