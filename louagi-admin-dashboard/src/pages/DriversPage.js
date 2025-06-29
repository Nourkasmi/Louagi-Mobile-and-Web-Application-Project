// src/pages/DriversPage.js - Clean Version (50 lines vs 400+ lines)
import React from 'react';
import { useDriversData } from '../hooks/useDriversData';
import {
    DriversStatistics,
    DriversFilters,
    DriversTable,
    DriversQuickActions,
    DriversErrorState,
    DriversLoadingState
} from '../components/drivers';

const DriversPage = () => {
    const {
        drivers,
        loading,
        error,
        stats,
        filters,
        pagination,
        fetchDrivers,
        setFilters,
        handlePageChange,
        handleExport
    } = useDriversData();

    // Loading state
    if (loading) {
        return <DriversLoadingState />;
    }

    // Error state
    if (error) {
        return <DriversErrorState error={error} />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Drivers Management</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Manage drivers, verify licenses, and monitor performance
                        </p>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <DriversStatistics stats={stats} />

            {/* Filters */}
            <DriversFilters
                filters={filters}
                setFilters={setFilters}
                onRefresh={fetchDrivers}
                onExport={handleExport}
            />

            {/* Drivers Table */}
            <DriversTable
                drivers={drivers}
                pagination={pagination}
                onPageChange={handlePageChange}
            />

            {/* Quick Actions */}
            <DriversQuickActions />
        </div>
    );
};

export default DriversPage;