// src/pages/QueuePage.js - UPDATED WITH LIVE QUEUE MODAL
import React, { useState } from 'react';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LiveQueueModal from '../components/queue/LiveQueueModal';
import {
    QueueFilters,
    QueueTable,
    QueueStatistics,
    QueueQuickActions,
    QueueEmptyState,
    QueueErrorState
} from '../components/queue';
import { useQueueData } from '../hooks/useQueueData';

const QueuePage = () => {
    const {
        // Data
        queues,
        stations,
        destinations,
        schedules,

        // Loading states
        loading,
        refreshing,
        actionLoading,
        error,

        // Filters
        selectedStation,
        selectedSchedule,
        selectedDestination,
        setSelectedStation,
        setSelectedSchedule,
        setSelectedDestination,

        // Actions
        fetchQueueData,
        moveDriverUp,
        moveDriverDown,
        markDriverCalled,
        markDriverDone,
        skipDriver,

        // Helpers
        getSchedulesForStation,
        getDestinationsForStation,

        // Computed
        hasFiltersSelected
    } = useQueueData();

    // Live Queue Modal state
    const [showLiveQueueModal, setShowLiveQueueModal] = useState(false);

    // Handle filter changes with cleanup
    const handleStationChange = (stationId) => {
        setSelectedStation(stationId);
        setSelectedSchedule('');
        setSelectedDestination('');
    };

    const handleScheduleChange = (scheduleId) => {
        setSelectedSchedule(scheduleId);
        setSelectedDestination('');
    };

    const handleDestinationChange = (destinationId) => {
        setSelectedDestination(destinationId);
    };

    // Queue action handlers
    const handleViewLiveQueue = () => {
        setShowLiveQueueModal(true);
    };

    const handleCloseLiveQueueModal = () => {
        setShowLiveQueueModal(false);
    };

    const handleReorderQueue = () => {
        // Open reorder modal or enable drag-and-drop mode
        alert('Queue reordering feature - Coming Soon!\n\nThis will allow you to:\n• Drag and drop drivers to reorder\n• Bulk position changes\n• Priority adjustments');
    };

    const handleRefreshAll = async () => {
        // Refresh all queue data
        try {
            await fetchQueueData();
            alert('All queue data refreshed successfully!');
        } catch (error) {
            alert('Failed to refresh queue data');
        }
    };

    // Prepare queue data for LiveQueueModal
    const getQueueDataForModal = () => {
        if (!hasFiltersSelected || queues.length === 0) {
            return null; // Will use mock data
        }

        // Find the selected station and destination names
        const station = stations.find(s => s.id === selectedStation);
        const destination = destinations.find(d => d.id === selectedDestination);
        const schedule = schedules.find(s => s.id === selectedSchedule);

        return {
            stationName: station?.name || 'Unknown Station',
            scheduleTime: schedule ? `${schedule.startTime} - ${schedule.endTime}` : 'Unknown Schedule',
            destinationName: destination?.description || destination?.endStation?.name || 'Unknown Destination',
            queues: queues
        };
    };

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="Queue Management" subtitle="Loading..." />
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="large" text="Loading queue data..." />
                </div>
            </div>
        );
    }

    // Error state (only for initial data loading)
    if (error && !hasFiltersSelected) {
        return (
            <div className="space-y-6">
                <PageHeader title="Queue Management" subtitle="Error loading data" />
                <QueueErrorState
                    error={error}
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Queue Management"
                subtitle="Manage driver queues and waiting times"
            />

            {/* Queue Quick Actions */}
            <QueueQuickActions
                onViewLiveQueue={handleViewLiveQueue}
                onReorderQueue={handleReorderQueue}
                onRefreshAll={handleRefreshAll}
                hasActiveQueue={hasFiltersSelected}
            />

            {/* Queue Filters */}
            <QueueFilters
                stations={stations}
                schedules={schedules}
                destinations={destinations}
                selectedStation={selectedStation}
                selectedSchedule={selectedSchedule}
                selectedDestination={selectedDestination}
                onStationChange={handleStationChange}
                onScheduleChange={handleScheduleChange}
                onDestinationChange={handleDestinationChange}
                onRefresh={fetchQueueData}
                refreshing={refreshing}
                getSchedulesForStation={getSchedulesForStation}
                getDestinationsForStation={getDestinationsForStation}
            />

            {/* Queue Content */}
            {!hasFiltersSelected ? (
                <QueueEmptyState hasFiltersSelected={hasFiltersSelected} />
            ) : (
                <>
                    {/* Queue Statistics */}
                    {queues.length > 0 && (
                        <QueueStatistics queues={queues} />
                    )}

                    {/* Queue Table */}
                    <div data-queue-table>
                        <QueueTable
                            queues={queues}
                            actionLoading={actionLoading}
                            onMoveUp={moveDriverUp}
                            onMoveDown={moveDriverDown}
                            onMarkCalled={markDriverCalled}
                            onMarkDone={markDriverDone}
                            onSkipDriver={skipDriver}
                        />
                    </div>

                    {/* Error state for queue operations */}
                    {error && hasFiltersSelected && (
                        <QueueErrorState
                            error={error}
                            onRetry={fetchQueueData}
                        />
                    )}
                </>
            )}

            {/* Live Queue Modal */}
            <LiveQueueModal
                isOpen={showLiveQueueModal}
                onClose={handleCloseLiveQueueModal}
                queueData={getQueueDataForModal()}
                onRefresh={fetchQueueData}
                refreshing={refreshing}
            />
        </div>
    );
};

export default QueuePage;