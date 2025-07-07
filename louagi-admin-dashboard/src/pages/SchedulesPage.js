// src/pages/SchedulesPage.js - FIXED VERSION with ScheduleDetailsModal

// ✅ STEP 1: Make sure ScheduleDetailsModal is exported in src/components/schedules/index.js
// The index.js should include:
// export { default as ScheduleDetailsModal } from './ScheduleDetailsModal';

import React, { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useSchedulesData } from '../hooks/useSchedulesData';
import {
    ScheduleCard,
    ScheduleFilters,
    ScheduleModal,
    ScheduleEmptyState,
    ScheduleErrorState,
    SchedulePagination,
    ScheduleDetailsModal  // ✅ ADD THIS IMPORT
} from '../components/schedules';
import { LoadingSpinner } from '../components/common';

const SchedulesPage = () => {
    const {
        schedules,
        stations,
        loading,
        error,
        pagination,
        filters,
        daysOfWeek,
        fetchSchedules,
        deleteSchedule,
        handleFilterChange,
        handlePageChange,
        handleScheduleSave,
        hasFilters
    } = useSchedulesData();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);  // ✅ ADD THIS STATE
    const [selectedSchedule, setSelectedSchedule] = useState(null);   // ✅ ADD THIS STATE

    const handleCreateSchedule = () => {
        setShowCreateModal(true);
    };

    const handleEditSchedule = (schedule) => {
        setEditingSchedule(schedule);
    };

    // ✅ ADD THIS FUNCTION
    const handleViewDetails = (schedule) => {
        setSelectedSchedule(schedule);
        setShowDetailsModal(true);
    };

    const handleModalClose = () => {
        setShowCreateModal(false);
        setEditingSchedule(null);
        setShowDetailsModal(false);    // ✅ ADD THIS
        setSelectedSchedule(null);     // ✅ ADD THIS
    };

    const handleModalSave = (savedSchedule) => {
        handleScheduleSave(savedSchedule);
        handleModalClose();
    };

    // Loading state
    if (loading && schedules.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <LoadingSpinner text="Loading schedules..." />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <ScheduleErrorState
                error={error}
                onRetry={fetchSchedules}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Schedules Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        {pagination.total} schedules found • Connected to backend
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={fetchSchedules}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <button
                        onClick={handleCreateSchedule}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2 inline" />
                        Create Schedule
                    </button>
                </div>
            </div>

            {/* Filters */}
            <ScheduleFilters
                filters={filters}
                stations={stations}
                daysOfWeek={daysOfWeek}
                onFilterChange={handleFilterChange}
            />

            {/* Schedules List */}
            <div className="space-y-4">
                {schedules.length === 0 ? (
                    <ScheduleEmptyState
                        hasFilters={hasFilters}
                        onCreateFirst={handleCreateSchedule}
                    />
                ) : (
                    schedules.map((schedule) => (
                        <ScheduleCard
                            key={schedule.id}
                            schedule={schedule}
                            daysOfWeek={daysOfWeek}
                            onEdit={handleEditSchedule}
                            onDelete={deleteSchedule}
                            onViewDetails={handleViewDetails}  // ✅ PASS THE FUNCTION
                        />
                    ))
                )}
            </div>

            {/* Pagination */}
            <SchedulePagination
                pagination={pagination}
                onPageChange={handlePageChange}
            />

            {/* Create/Edit Modal */}
            {(showCreateModal || editingSchedule) && (
                <ScheduleModal
                    schedule={editingSchedule}
                    stations={stations}
                    daysOfWeek={daysOfWeek}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                />
            )}

            {/* ✅ ADD THE DETAILS MODAL */}
            {showDetailsModal && selectedSchedule && (
                <ScheduleDetailsModal
                    schedule={selectedSchedule}
                    daysOfWeek={daysOfWeek}
                    onClose={handleModalClose}
                    onEdit={handleEditSchedule}
                />
            )}

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
            </div>
        </div>
    );
};

export default SchedulesPage;