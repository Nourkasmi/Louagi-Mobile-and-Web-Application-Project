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
    ScheduleDetailsModal
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
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);

    const handleCreateSchedule = () => {
        setShowCreateModal(true);
    };

    const handleViewDetails = (schedule) => {
        setSelectedSchedule(schedule);
        setShowDetailsModal(true);
    };

    const handleModalClose = () => {
        setShowCreateModal(false);
        setShowDetailsModal(false);
        setSelectedSchedule(null);
    };

    const handleModalSave = (savedSchedule) => {
        handleScheduleSave(savedSchedule);
        handleModalClose();
    };

    // Simple wrapper that just calls the hook's deleteSchedule function
    const handleDeleteSchedule = (scheduleId, stationName) => {
        console.log('📄 SchedulesPage: Delete requested for:', scheduleId, stationName);
        deleteSchedule(scheduleId, stationName);
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

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 p-3 rounded text-xs text-gray-600">
                    Debug: {schedules.length} schedules loaded • API: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                </div>
            )}

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
                            onDelete={handleDeleteSchedule}
                            onViewDetails={handleViewDetails}
                        />
                    ))
                )}
            </div>

            {/* Pagination */}
            <SchedulePagination
                pagination={pagination}
                onPageChange={handlePageChange}
            />

            {/* Create Modal */}
            {showCreateModal && (
                <ScheduleModal
                    schedule={null}
                    stations={stations}
                    daysOfWeek={daysOfWeek}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                />
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedSchedule && (
                <ScheduleDetailsModal
                    schedule={selectedSchedule}
                    daysOfWeek={daysOfWeek}
                    onClose={handleModalClose}
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

export default SchedulesPage;