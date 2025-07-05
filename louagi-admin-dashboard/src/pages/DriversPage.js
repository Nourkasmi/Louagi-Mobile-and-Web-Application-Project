// src/pages/DriversPage.js - Fixed with proper error handling
import React, { useState } from 'react';
import { useDriversData } from '../hooks/useDriversData';
import {
    DriversStatistics,
    DriversFilters,
    DriversTable,
    DriversQuickActions,
    DriversErrorState,
    DriversLoadingState
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
        handlePageChange,
        handleExport
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

        if (!window.confirm(`Are you sure you want to delete driver "${driverName || 'Unknown'}"? This action cannot be undone.`)) {
            return { success: false, error: 'Cancelled by user' };
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

            {/* Simple modals for now - will work on complex ones after basic functionality is confirmed */}
            {showDetailsModal && selectedDriver && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Driver Details</h2>
                        <div className="space-y-2">
                            <p><strong>Name:</strong> {selectedDriver.name || 'N/A'}</p>
                            <p><strong>Email:</strong> {selectedDriver.email || 'N/A'}</p>
                            <p><strong>Phone:</strong> {selectedDriver.phone || 'N/A'}</p>
                            <p><strong>License:</strong> {selectedDriver.licenseNo || 'N/A'}</p>
                            <p><strong>Status:</strong> {selectedDriver.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                        <div className="mt-6 flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowDetailsModal(false);
                                    setShowEditModal(true);
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded"
                            >
                                Edit
                            </button>
                            <button
                                onClick={handleCloseModals}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && selectedDriver && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Edit Driver</h2>
                        <p>Edit functionality for {selectedDriver.name || 'Unknown Driver'}</p>
                        <p className="text-sm text-gray-600 mt-2">
                            Advanced edit modal will be implemented once basic functionality is confirmed.
                        </p>
                        <div className="mt-6 flex space-x-3">
                            <button
                                onClick={handleCloseModals}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && selectedDriver && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4 text-red-600">Delete Driver</h2>
                        <p>Are you sure you want to delete {selectedDriver.name || 'this driver'}?</p>
                        <div className="mt-6 flex space-x-3">
                            <button
                                onClick={() => {
                                    deleteDriver(selectedDriver.id, selectedDriver.name);
                                    handleCloseModals();
                                }}
                                className="bg-red-600 text-white px-4 py-2 rounded"
                                disabled={actionLoading[selectedDriver.id]}
                            >
                                {actionLoading[selectedDriver.id] ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                onClick={handleCloseModals}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
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