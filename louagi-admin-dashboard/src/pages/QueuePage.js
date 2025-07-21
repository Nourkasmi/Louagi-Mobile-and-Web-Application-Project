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
        if (!hasFiltersSelected) {
            alert('Please select Station, Schedule, and Destination first to view the live queue.');
            return;
        }
        setShowLiveQueueModal(true);
    };

    const handleCloseLiveQueueModal = () => {
        setShowLiveQueueModal(false);
    };

    const handleReorderQueue = () => {
        if (!hasFiltersSelected) {
            alert('Please select Station, Schedule, and Destination first.');
            return;
        }
        // Disable reorder functionality as requested
        alert('Queue reordering is currently disabled.\n\nUse the Live Queue to manage driver positions instead.');
    };

    // Prepare queue data for LiveQueueModal
    const getQueueDataForModal = () => {
        if (!hasFiltersSelected) {
            return null; // Will use mock data
        }

        // Find the selected station, destination, and schedule names
        const station = stations.find(s => s.id === selectedStation);
        const destination = destinations.find(d => d.id === selectedDestination);
        const schedule = schedules.find(s => s.id === selectedSchedule);

        return {
            stationName: station?.name || 'Unknown Station',
            scheduleTime: schedule ? `${schedule.startTime} - ${schedule.endTime}` : 'Unknown Schedule',
            destinationName: destination?.description || destination?.endStation?.name || 'Unknown Destination',
            queues: queues || []
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

            {/* Queue Filters - at the top */}
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

            {/* Only Live Queue Monitor remains */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Live Queue Management */}
                <div className="bg-white rounded-lg shadow border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Queue Monitor</h3>
                    <div className="space-y-3">
                        <div className="text-sm text-gray-600">
                            {hasFiltersSelected
                                ? `View real-time queue for selected route`
                                : 'Select station, schedule, and destination to view queue'
                            }
                        </div>
                        <button
                            onClick={handleViewLiveQueue}
                            disabled={!hasFiltersSelected}
                            className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${hasFiltersSelected
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            View Live Queue
                        </button>
                        {hasFiltersSelected && (
                            <div className="text-xs text-green-600 text-center">
                                ✅ Queue selected: Ready to view
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
