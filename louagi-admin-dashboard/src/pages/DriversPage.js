// src/pages/DriversPage.js - Complete File with Enhanced Modals
import React, { useState } from 'react';
import { useDriversData } from '../hooks/useDriversData';
import {
    DriversStatistics,
    DriversFilters,
    DriversTable,
    DriversQuickActions,
    DriversErrorState,
    DriversLoadingState,
    DriverDetailsModal,
    EditDriverModal,
    DeleteDriverModal
} from '../components/drivers';

const DriversPage = () => {
    const {
        drivers,
        loading,
        error,
        stats,
        filters,
        pagination,
        fetchDrivers,
        setFilters,
        handlePageChange
    } = useDriversData();

    // Modal states
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [actionLoading, setActionLoading] = useState({});

    // Modal handlers with null checks
    const handleViewDriver = (driver) => {
        if (!driver || !driver.id) {
            console.error('Invalid driver data for view:', driver);
            return;
        }
        setSelectedDriver(driver);
        setShowDetailsModal(true);
    };

    const handleEditDriver = (driver) => {
        if (!driver || !driver.id) {
            console.error('Invalid driver data for edit:', driver);
            return;
        }
        setSelectedDriver(driver);
        setShowEditModal(true);
    };

    const handleDeleteDriver = (driver) => {
        if (!driver || !driver.id) {
            console.error('Invalid driver data for delete:', driver);
            return;
        }
        setSelectedDriver(driver);
        setShowDeleteModal(true);
    };

    const handleCloseModals = () => {
        setShowDetailsModal(false);
        setShowEditModal(false);
        setShowDeleteModal(false);
        setSelectedDriver(null);
    };

    // API Actions with enhanced error handling
    const updateDriver = async (driverId, updateData) => {
        if (!driverId) {
            alert('Invalid driver ID');
            return { success: false, error: 'Invalid driver ID' };
        }

        try {
            setActionLoading(prev => ({ ...prev, [driverId]: true }));

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseUrl}/users/${driverId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                // Refresh drivers list
                await fetchDrivers();
                alert('Driver updated successfully!');
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to update driver');
            }
        } catch (error) {
            console.error('Update driver error:', error);
            const errorMessage = error.message || 'Failed to update driver';
            alert('Failed to update driver: ' + errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setActionLoading(prev => ({ ...prev, [driverId]: false }));
        }
    };

    const deleteDriver = async (driverId, driverName) => {
        if (!driverId) {
            alert('Invalid driver ID');
            return { success: false, error: 'Invalid driver ID' };
        }

        try {
            setActionLoading(prev => ({ ...prev, [driverId]: true }));

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseUrl}/users/${driverId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                // Refresh drivers list
                await fetchDrivers();
                alert('Driver deleted successfully!');
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to delete driver');
            }
        } catch (error) {
            console.error('Delete driver error:', error);
            const errorMessage = error.message || 'Failed to delete driver';
            alert('Failed to delete driver: ' + errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setActionLoading(prev => ({ ...prev, [driverId]: false }));
        }
    };

    const toggleDriverStatus = async (driverId, currentStatus) => {
        if (!driverId) {
            alert('Invalid driver ID');
            return { success: false, error: 'Invalid driver ID' };
        }

        try {
            setActionLoading(prev => ({ ...prev, [driverId]: true }));

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseUrl}/users/${driverId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                // Refresh drivers list
                await fetchDrivers();
                alert(`Driver ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to update driver status');
            }
        } catch (error) {
            console.error('Toggle status error:', error);
            const errorMessage = error.message || 'Failed to update driver status';
            alert('Failed to update driver status: ' + errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setActionLoading(prev => ({ ...prev, [driverId]: false }));
        }
    };

    const handleExport = () => {
        try {
            if (drivers.length === 0) {
                alert('No drivers to export');
                return;
            }

            const csvContent = [
                ['Name', 'Email', 'Phone', 'License', 'Vehicle Type', 'Rating', 'Status'].join(','),
                ...drivers.map(driver => [
                    driver.name || 'Unknown',
                    driver.email || 'N/A',
                    driver.phone || 'N/A',
                    driver.licenseNo || 'N/A',
                    driver.vehicleType || 'Unknown',
                    driver.rating || '0',
                    driver.isActive ? 'Active' : 'Inactive'
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `drivers-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            alert('Drivers exported successfully!');
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export drivers');
        }
    };

    // Loading state
    if (loading) {
        return <DriversLoadingState />;
    }

    // Error state
    if (error) {
        return <DriversErrorState error={error} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Drivers Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage drivers, verify licenses, and monitor performance
                        </p>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <DriversStatistics stats={stats} />

            {/* Filters */}
            <DriversFilters
                filters={filters}
                setFilters={setFilters}
                onRefresh={fetchDrivers}
                onExport={handleExport}
            />

            {/* Enhanced Drivers Table */}
            <DriversTable
                drivers={drivers}
                pagination={pagination}
                onPageChange={handlePageChange}
                onViewDriver={handleViewDriver}
                onEditDriver={handleEditDriver}
                onDeleteDriver={handleDeleteDriver}
                onToggleStatus={toggleDriverStatus}
                actionLoading={actionLoading}
            />

            {/* Quick Actions */}
            <DriversQuickActions />

            {/* Enhanced Modals */}
            {showDetailsModal && selectedDriver && (
                <DriverDetailsModal
                    driver={selectedDriver}
                    onClose={handleCloseModals}
                    onToggleStatus={toggleDriverStatus}
                />
            )}

            {showEditModal && selectedDriver && (
                <EditDriverModal
                    driver={selectedDriver}
                    onClose={handleCloseModals}
                    onSave={updateDriver}
                    actionLoading={actionLoading[selectedDriver.id]}
                />
            )}

            {showDeleteModal && selectedDriver && (
                <DeleteDriverModal
                    driver={selectedDriver}
                    onClose={handleCloseModals}
                    onConfirm={deleteDriver}
                    actionLoading={actionLoading[selectedDriver.id]}
                />
            )}

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'} •
                Last updated: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

export default DriversPage;