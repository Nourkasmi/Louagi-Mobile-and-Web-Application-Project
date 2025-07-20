// src/pages/StationsPage.js - VERSION with Enhanced Delete Modal
import React, { useState } from 'react';
import { useStationsData } from '../hooks/useStationsData';
import {
    StationStatistics,
    StationFilters,
    StationTable,
    AddStationModal,
    StationPageHeader
} from '../components/stations';
import EditStationModal from '../components/stations/EditStationModal';
import DeleteStationModal from '../components/stations/DeleteStationModal'; // Import the new modal
import StationErrorState from '../components/stations/StationErrorState';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StationsPage = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false); // Add delete modal state
    const [selectedStation, setSelectedStation] = useState(null);
    const [stationToDelete, setStationToDelete] = useState(null); // Station to delete
    const [deleting, setDeleting] = useState(false); // Delete loading state

    const {
        stations,
        stats,
        pagination,
        loading,
        error,
        saveLoading,
        filters,
        setFilters,
        fetchStations,
        addStation,
        exportStations
    } = useStationsData();

    // Handle actions
    const handleAddStation = () => setShowAddModal(true);

    const handleCloseModals = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setShowDeleteModal(false);
        setSelectedStation(null);
        setStationToDelete(null);
    };

    const handleSubmitStation = async (stationData) => {
        const result = await addStation(stationData);
        if (result.success) {
            setShowAddModal(false);
        }
        return result;
    };

    const handleEditStation = (station) => {
        console.log('Edit station:', station);
        setSelectedStation(station);
        setShowEditModal(true);
    };

    const handleUpdateStation = async (stationId, stationData) => {
        try {
            const token = localStorage.getItem('louagi_token');
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${API_BASE_URL}/stations/${stationId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: stationData.name,
                    address: stationData.address,
                    city: stationData.city,
                    state: stationData.state,
                    zipCode: stationData.zipCode,
                    capacity: parseInt(stationData.capacity),
                    contactPhone: stationData.contactPhone || null,
                    contactEmail: stationData.contactEmail || null,
                    amenities: stationData.amenities,
                    isActive: stationData.isActive
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                await fetchStations();
                alert('Station updated successfully!');
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to update station');
            }
        } catch (error) {
            console.error('Update station error:', error);
            alert('Failed to update station: ' + error.message);
            return { success: false, error: error.message };
        }
    };

    // ✅ UPDATED: Show delete modal instead of immediate confirmation
    const handleDeleteStation = (station) => {
        console.log('Preparing to delete station:', station);
        setStationToDelete(station);
        setShowDeleteModal(true);
    };

    // ✅ NEW: Actual delete function called from modal
    const handleConfirmDelete = async (station) => {
        try {
            setDeleting(true);

            const token = localStorage.getItem('louagi_token');
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            console.log('🗑️ Deleting station:', station.id, station.name);

            const response = await fetch(`${API_BASE_URL}/stations/${station.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📥 Delete response status:', response.status);

            // Handle different response scenarios
            if (response.status === 404) {
                alert('Station not found. It may have already been deleted.');
                await fetchStations();
                handleCloseModals();
                return;
            }

            if (response.status === 409) {
                const data = await response.json();
                alert(`Cannot delete station: ${data.message || 'Station has active dependencies (trips, bookings, etc.)'}`);
                handleCloseModals();
                return;
            }

            if (response.status === 403) {
                alert('You do not have permission to delete this station.');
                handleCloseModals();
                return;
            }

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    // Response not JSON, use status text
                }
                throw new Error(errorMessage);
            }

            // Success case
            const data = await response.json();

            if (data.success) {
                console.log('✅ Station deleted successfully');

                // Refresh the stations list
                await fetchStations();

                // Close modal and show success
                handleCloseModals();
                alert(`Station "${station.name}" has been deleted successfully!`);
            } else {
                throw new Error(data.message || 'Failed to delete station');
            }

        } catch (error) {
            console.error('❌ Delete station error:', error);

            // User-friendly error messages
            let errorMessage = error.message;

            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'Network error. Please check your connection and ensure the backend is running.';
            } else if (error.message.includes('token') || error.message.includes('401')) {
                errorMessage = 'Authentication failed. Please login again.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error. The station may have dependencies that prevent deletion.';
            }

            alert(`Failed to delete station: ${errorMessage}`);
            handleCloseModals();
        } finally {
            setDeleting(false);
        }
    };

    const handleViewStation = (station) => {
        console.log('View station:', station);

        // Enhanced view modal with more details
        const amenitiesList = station.amenities && Object.keys(station.amenities).length > 0
            ? Object.entries(station.amenities)
                .filter(([key, value]) => value)
                .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1))
                .join(', ')
            : 'None';

        const stationDetails = `Station Details:\n\n` +
            `📍 Name: ${station.name}\n` +
            `🏙️ Location: ${station.address}, ${station.city}, ${station.state} ${station.zipCode}\n` +
            `👥 Capacity: ${station.capacity} slots\n` +
            `📞 Phone: ${station.contactPhone || 'Not provided'}\n` +
            `📧 Email: ${station.contactEmail || 'Not provided'}\n` +
            `🎯 Status: ${station.isActive ? '✅ Active' : '❌ Inactive'}\n` +
            `🏪 Amenities: ${amenitiesList}\n` +
            `📊 Utilization: ${station.utilizationRate || 0}%\n` +
            `🚗 Active Trips: ${station.activeTrips || 0}\n` +
            `⏰ Last Updated: ${station.lastActivity ? new Date(station.lastActivity).toLocaleString() : 'Unknown'}`;

        alert(stationDetails);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="large" text="Loading stations..." />
            </div>
        );
    }

    // Error state
    if (error) {
        return <StationErrorState error={error} onRetry={fetchStations} />;
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <StationPageHeader
                onAddStation={handleAddStation}
                onRefresh={fetchStations}
                onExport={exportStations}
            />

            {/* Statistics Cards */}
            <StationStatistics stats={stats} />

            {/* Filters */}
            <StationFilters
                filters={filters}
                setFilters={setFilters}
                onRefresh={fetchStations}
            />

            {/* Stations Table */}
            <StationTable
                stations={stations}
                pagination={pagination}
                setFilters={setFilters}
                onEdit={handleEditStation}
                onDelete={handleDeleteStation}
                onView={handleViewStation}
            />

            {/* Add Station Modal */}
            <AddStationModal
                showModal={showAddModal}
                onClose={handleCloseModals}
                onSubmit={handleSubmitStation}
                saveLoading={saveLoading}
            />

            {/* Edit Station Modal */}
            <EditStationModal
                station={selectedStation}
                showModal={showEditModal}
                onClose={handleCloseModals}
                onSubmit={handleUpdateStation}
                saveLoading={saveLoading}
            />

            {/* ✅ NEW: Enhanced Delete Station Modal */}
            <DeleteStationModal
                station={stationToDelete}
                showModal={showDeleteModal}
                onClose={handleCloseModals}
                onConfirm={handleConfirmDelete}
                deleting={deleting}
            />

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'} •
                Last updated: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

export default StationsPage;