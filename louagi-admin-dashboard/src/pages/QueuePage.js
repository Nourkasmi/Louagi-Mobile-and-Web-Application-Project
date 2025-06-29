// src/pages/QueuePage.js
import React from 'react';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import QueueFilters from '../components/queue/QueueFilters';
import QueueTable from '../components/queue/QueueTable';
import QueueStatistics from '../components/queue/QueueStatistics';
import QueueEmptyState from '../components/queue/QueueEmptyState';
import { QueueErrorState } from '../components/queue/QueueErrorState';
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
                    <QueueTable
                        queues={queues}
                        actionLoading={actionLoading}
                        onMoveUp={moveDriverUp}
                        onMoveDown={moveDriverDown}
                        onMarkCalled={markDriverCalled}
                        onMarkDone={markDriverDone}
                        onSkipDriver={skipDriver}
                    />

                    {/* Error state for queue operations */}
                    {error && hasFiltersSelected && (
                        <QueueErrorState
                            error={error}
                            onRetry={fetchQueueData}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default QueuePage;