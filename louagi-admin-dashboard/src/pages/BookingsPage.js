// src/pages/BookingsPage.js - Clean Version
import React, { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useBookingsData } from '../hooks/useBookingsData';
import {
    BookingStats,
    BookingFilters,
    BookingTable,
    BookingDetailsModal,
    BookingQuickActions
} from '../components/bookings';
import { Pagination, ErrorDisplay, EmptyState } from '../components/common';

const BookingsPage = () => {
    const {
        bookings,
        stats,
        pagination,
        loading,
        refreshing,
        error,
        filters,
        setFilters,
        updateBookingStatus,
        exportBookings,
        refreshData,
        handlePageChange
    } = useBookingsData();

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const handleViewDetails = (booking) => {
        setSelectedBooking(booking);
        setShowDetailsModal(true);
    };

    const handleCloseModal = () => {
        setSelectedBooking(null);
        setShowDetailsModal(false);
    };

    const handleStatusUpdate = async (bookingId, newStatus, reason = '') => {
        const result = await updateBookingStatus(bookingId, newStatus, reason);
        return result;
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading bookings...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Manage passenger bookings, payments, and trip assignments
                    </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error Loading Bookings</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <p className="text-xs text-red-600 mt-2">
                                Make sure your backend is running on {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                            </p>
                            <button
                                onClick={refreshData}
                                className="mt-3 inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Bookings Management</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Manage passenger bookings, payments, and trip assignments
                </p>
            </div>

            {/* Stats Cards */}
            <BookingStats stats={stats} />

            {/* Filters */}
            <BookingFilters
                filters={filters}
                setFilters={setFilters}
                onExport={exportBookings}
                onRefresh={refreshData}
                refreshing={refreshing}
            />

            {/* Bookings Table */}
            <BookingTable
                bookings={bookings}
                onViewDetails={handleViewDetails}
                onUpdateStatus={handleStatusUpdate}
                loading={false}
            />

            {/* Pagination */}
            <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
                itemName="bookings"
            />


            {/* Booking Details Modal */}
            {showDetailsModal && selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={handleCloseModal}
                    onUpdateStatus={handleStatusUpdate}
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

export default BookingsPage;