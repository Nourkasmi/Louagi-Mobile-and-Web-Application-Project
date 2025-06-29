// src/pages/DestinationsPage.js - Clean Version
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
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

        // Filters
        searchTerm,
        setSearchTerm,
        filters,
        setFilters,

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
                subtitle="Manage routes and destinations"
                action={
                    <button
                        onClick={handleCreateNew}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Destination</span>
                    </button>
                }
            />

            {/* Filters */}
            <DestinationFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filters={filters}
                setFilters={setFilters}
                stations={stations}
            />

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
        </div>
    );
};

export default DestinationsPage;