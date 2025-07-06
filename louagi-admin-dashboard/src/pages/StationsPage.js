// src/pages/StationsPage.js - CLEANED VERSION (Removed Quick Actions)
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
import StationErrorState from '../components/stations/StationErrorState';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StationsPage = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);

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
        setSelectedStation(null);
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

    const handleDeleteStation = (station) => {
        console.log('Delete station:', station);
        if (window.confirm(`Are you sure you want to delete "${station.name}"? This action cannot be undone.`)) {
            alert('Delete functionality will be implemented in the next update.');
        }
    };

    const handleViewStation = (station) => {
        console.log('View station:', station);
        alert(`Station Details:\n\nName: ${station.name}\nCity: ${station.city}\nCapacity: ${station.capacity}\nStatus: ${station.isActive ? 'Active' : 'Inactive'}`);
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

            {/* REMOVED: Quick Actions Section */}

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

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'} •
                Last updated: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

export default StationsPage;