// src/pages/StationsPage.js - Clean Version
import React, { useState } from 'react';
import { useStationsData } from '../hooks/useStationsData';
import {
    StationStatistics,
    StationFilters,
    StationTable,
    AddStationModal,
    StationQuickActions,
    StationPageHeader
} from '../components/stations';
import StationErrorState from '../components/stations/StationErrorState';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StationsPage = () => {
    const [showAddModal, setShowAddModal] = useState(false);

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
    const handleCloseModal = () => setShowAddModal(false);

    const handleSubmitStation = async (stationData) => {
        const result = await addStation(stationData);
        if (result.success) {
            setShowAddModal(false);
        }
        return result;
    };

    const handleEditStation = (station) => {
        console.log('Edit station:', station);
        // TODO: Implement edit functionality
    };

    const handleDeleteStation = (station) => {
        console.log('Delete station:', station);
        // TODO: Implement delete functionality
    };

    const handleViewStation = (station) => {
        console.log('View station:', station);
        // TODO: Implement view functionality
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

            {/* Quick Actions */}
            <StationQuickActions stats={stats} />

            {/* Add Station Modal */}
            <AddStationModal
                showModal={showAddModal}
                onClose={handleCloseModal}
                onSubmit={handleSubmitStation}
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