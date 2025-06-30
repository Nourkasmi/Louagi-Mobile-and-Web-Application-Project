// src/pages/TripsPage.js
import React from 'react';
import { useTripsData } from '../hooks/useTripsData';
import {
    TripStatistics,
    TripFilters,
    TripTable
} from '../components/trips';
import { Pagination } from '../components/common';
import PageHeader from '../components/common/PageHeader';
import TripLoadingState from '../components/trips/TripLoadingState';
import TripErrorState from '../components/trips/TripErrorState';

const TripsPage = () => {
    const {
        // Data
        trips,
        stats,
        pagination,

        // Loading states
        loading,
        refreshing,
        error,

        // Filters
        filters,
        setFilters,

        // Actions
        updateTripStatus,
        exportTrips,
        refreshData,
        handlePageChange,
        viewTripDetails
    } = useTripsData();

    // Loading state
    if (loading) {
        return <TripLoadingState />;
    }

    // Error state
    if (error) {
        return <TripErrorState error={error} onRetry={refreshData} />;
    }

    // Main render
    return (
        <div className="space-y-6">
            <PageHeader
                title="Trips Management"
                subtitle={`${pagination.total} trips found • Connected to backend`}
            />

            <TripStatistics stats={stats} />

            <TripFilters
                filters={filters}
                setFilters={setFilters}
                onRefresh={refreshData}
                onExport={exportTrips}
                refreshing={refreshing}
            />

            <TripTable
                trips={trips}
                loading={loading}
                onUpdateStatus={updateTripStatus}
                onViewDetails={viewTripDetails}
            />

            {pagination.totalPages > 1 && (
                <Pagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    itemName="trips"
                />
            )}

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
            </div>
        </div>
    );
};

export default TripsPage;