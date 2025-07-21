import React, { useState } from 'react';
import { Plus, RefreshCw, Download } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import { useDestinationsData } from '../hooks/useDestinationsData';
import {
    DestinationFilters,
    DestinationsTable,
    DestinationModal,
    DestinationPagination,
    DestinationLoadingState,
    DestinationErrorState
} from '../components/destinations';

const DestinationsPage = () => {
    const {
        // Data
        destinations,
        stations,
        loading,
        error,
        submitting,

        // Pagination
        currentPage,
        totalPages,
        setCurrentPage,

        // Filters (simplified to just search)
        searchTerm,
        setSearchTerm,

        // Actions
        fetchDestinations,
        createDestination,
        updateDestination,
        deleteDestination
    } = useDestinationsData();

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedDestination, setSelectedDestination] = useState(null);

    // ========================================
    // EVENT HANDLERS
    // ========================================

    const handleCreateNew = () => {
        setShowCreateModal(true);
    };

    const handleEdit = (destination) => {
        setSelectedDestination(destination);
        setShowEditModal(true);
    };

    const handleDelete = async (destination) => {
        await deleteDestination(destination);
    };

    const handleCreateSubmit = async (formData) => {
        const result = await createDestination(formData);
        if (result && result.success) {
            setShowCreateModal(false);
        }
        return result;
    };

    const handleEditSubmit = async (formData) => {
        if (!selectedDestination) return { success: false };

        const result = await updateDestination(selectedDestination.id, formData);
        if (result && result.success) {
            setShowEditModal(false);
            setSelectedDestination(null);
        }
        return result;
    };

    const handleCloseModals = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedDestination(null);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleRefresh = () => {
        fetchDestinations();
    };

    const handleExport = () => {
        if (destinations.length === 0) {
            alert('No destinations to export');
            return;
        }

        // Create CSV content
        const csvContent = [
            ['Route', 'Start Station', 'End Station', 'Distance (km)', 'Price ($)', 'Duration (min)', 'Status'].join(','),
            ...destinations.map(dest => [
                dest.description || `${dest.startStation?.name} to ${dest.endStation?.name}`,
                dest.startStation?.name || 'Unknown',
                dest.endStation?.name || 'Unknown',
                dest.distance || 0,
                dest.basePrice || 0,
                dest.estimatedDuration || 0,
                dest.isActive ? 'Active' : 'Inactive'
            ].join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `destinations-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // ========================================
    // RENDER CONDITIONS
    // ========================================

    if (loading && destinations.length === 0) {
        return <DestinationLoadingState />;
    }

    if (error && destinations.length === 0) {
        return (
            <DestinationErrorState
                error={error}
                onRetry={fetchDestinations}
            />
        );
    }

    // ========================================
    // MAIN RENDER
    // ========================================

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
                title="Destinations Management"
                subtitle={`${destinations.length} destinations found • Manage routes between stations`}
                action={
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleExport}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export</span>
                        </button>
                        <button
                            onClick={handleRefresh}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={handleCreateNew}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Add Destination</span>
                        </button>
                    </div>
                }
            />

            {/* Simplified Filters - Search Only */}
            <DestinationFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onRefresh={handleRefresh}
            />

            {/* Error state for operations */}
            {error && destinations.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800 text-sm">{error}</div>
                </div>
            )}

            {/* Destinations Table */}
            <DestinationsTable
                destinations={destinations}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onCreateNew={handleCreateNew}
            />

            {/* Pagination */}
            <DestinationPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={destinations.length}
            />

            {/* Create Modal */}
            <DestinationModal
                isOpen={showCreateModal}
                onClose={handleCloseModals}
                onSubmit={handleCreateSubmit}
                stations={stations}
                submitting={submitting}
            />

            {/* Edit Modal */}
            <DestinationModal
                isOpen={showEditModal}
                onClose={handleCloseModals}
                onSubmit={handleEditSubmit}
                stations={stations}
                initialData={selectedDestination}
                submitting={submitting}
            />

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'} •
                Last updated: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

export default DestinationsPage;