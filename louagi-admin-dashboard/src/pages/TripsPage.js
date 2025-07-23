import React, { useState, useEffect } from 'react';
import { useTripsData } from '../hooks/useTripsData';
import { useTripCreation } from '../hooks/useTripCreation';
import {
    TripStatistics,
    TripFilters,
    TripTable,
    TripModal
} from '../components/trips';
import { Pagination } from '../components/common';
import PageHeader from '../components/common/PageHeader';
import TripLoadingState from '../components/trips/TripLoadingState';
import TripErrorState from '../components/trips/TripErrorState';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, Plus } from 'lucide-react';

const TripsPage = () => {
    const [debugMode, setDebugMode] = useState(false);
    const [connectionTest, setConnectionTest] = useState(null);

    // Trip creation modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);

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
        viewTripDetails,

        // Debug info
        apiUrl,
        connectionStatus
    } = useTripsData();

    // Trip creation hook
    const {
        destinations,
        schedules,
        drivers,
        loading: creationLoading,
        submitting,
        fetchTripCreationData,
        createTrip,
        updateTrip
    } = useTripCreation();

    // Load trip creation data when modal opens
    useEffect(() => {
        if (showCreateModal || showEditModal) {
            fetchTripCreationData();
        }
    }, [showCreateModal, showEditModal, fetchTripCreationData]);

    // Test backend connection
    const testConnection = async () => {
        setConnectionTest({ status: 'testing' });

        try {
            const baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

            // Test health endpoint
            const healthResponse = await fetch(`${baseUrl}/health`);
            const healthData = await healthResponse.json();

            // Test trips endpoint
            const tripsResponse = await fetch(`${apiUrl}/trips?limit=1`);
            const tripsData = await tripsResponse.json();

            setConnectionTest({
                status: 'success',
                health: healthData,
                trips: tripsData,
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            setConnectionTest({
                status: 'error',
                error: err.message,
                timestamp: new Date().toISOString()
            });
        }
    };

    // Auto-test connection on mount if there's an error
    useEffect(() => {
        if (error && !connectionTest) {
            testConnection();
        }
    }, [error, connectionTest]);

    // Debug panel toggle (Ctrl+Shift+D)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                setDebugMode(!debugMode);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [debugMode]);

    // Enhanced retry function
    const handleRetry = async () => {
        setConnectionTest(null);
        await testConnection();
        await refreshData();
    };

    // Trip Modal Handlers
    const handleCreateTrip = () => {
        setShowCreateModal(true);
    };

    const handleEditTrip = (trip) => {
        setSelectedTrip(trip);
        setShowEditModal(true);
    };

    const handleCloseModals = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedTrip(null);
    };

    const handleCreateSubmit = async (formData) => {
        const result = await createTrip(formData);
        if (result && result.success) {
            setShowCreateModal(false);
            await refreshData(); // Refresh trips list
        }
        return result;
    };

    const handleEditSubmit = async (formData) => {
        if (!selectedTrip) return { success: false };

        const result = await updateTrip(selectedTrip.id, formData);
        if (result && result.success) {
            setShowEditModal(false);
            setSelectedTrip(null);
            await refreshData(); // Refresh trips list
        }
        return result;
    };

    // Enhanced view trip details with edit option
    const handleViewTripDetails = (trip) => {
        // You can either show a details modal or redirect to edit
        const action = window.confirm(
            `Trip Details:\nID: ${trip.id}\nRoute: ${trip.route?.description || 'Unknown'}\nStatus: ${trip.status}\n\nDo you want to edit this trip?`
        );

        if (action) {
            handleEditTrip(trip);
        }
    };

    // Connection Status Indicator
    const ConnectionStatus = () => {
        const getStatusColor = () => {
            switch (connectionStatus) {
                case 'connected': return 'text-green-500';
                case 'connecting': return 'text-yellow-500';
                case 'error': return 'text-red-500';
                default: return 'text-gray-500';
            }
        };

        const getStatusIcon = () => {
            switch (connectionStatus) {
                case 'connected': return <Wifi className="w-4 h-4" />;
                case 'connecting': return <RefreshCw className="w-4 h-4 animate-spin" />;
                case 'error': return <WifiOff className="w-4 h-4" />;
                default: return <AlertTriangle className="w-4 h-4" />;
            }
        };

        return (
            <div className={`inline-flex items-center space-x-2 text-sm ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="capitalize">{connectionStatus}</span>
            </div>
        );
    };

    // Debug Panel Component
    const DebugPanel = () => {
        if (!debugMode) return null;

        return (
            <div className="mb-6 bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-bold">🔧 Debug Panel</h3>
                    <button
                        onClick={() => setDebugMode(false)}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <h4 className="text-yellow-400 mb-2">🌐 Connection Info</h4>
                        <div>API URL: {apiUrl}</div>
                        <div>Status: {connectionStatus}</div>
                        <div>Trips Count: {trips.length}</div>
                        <div>Loading: {loading.toString()}</div>
                        <div>Error: {error || 'None'}</div>
                    </div>

                    <div>
                        <h4 className="text-yellow-400 mb-2">📊 Data Info</h4>
                        <div>Total Trips: {pagination.total}</div>
                        <div>Current Page: {pagination.currentPage}</div>
                        <div>Active Filters: {Object.values(filters).filter(Boolean).length}</div>
                        <div>Destinations: {destinations.length}</div>
                        <div>Drivers: {drivers.length}</div>
                    </div>
                </div>

                {connectionTest && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                        <h4 className="text-yellow-400 mb-2">🔍 Connection Test</h4>
                        <pre className="text-xs overflow-auto max-h-32">
                            {JSON.stringify(connectionTest, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-700">
                    <button
                        onClick={testConnection}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                    >
                        Test Connection
                    </button>
                </div>
            </div>
        );
    };

    // Enhanced Error State
    const EnhancedErrorState = () => (
        <div className="space-y-6">
            <PageHeader
                title="Trips Management"
                subtitle="⚠️ Connection Error"
            />

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-red-800 mb-2">
                            Failed to Load Trips
                        </h3>
                        <p className="text-red-700 mb-3">{error}</p>

                        <div className="bg-red-100 p-3 rounded mb-4">
                            <h4 className="font-medium text-red-800 mb-2">Troubleshooting Steps:</h4>
                            <ul className="text-sm text-red-700 space-y-1">
                                <li>• Check if backend is running on {apiUrl}</li>
                                <li>• Verify your internet connection</li>
                                <li>• Try refreshing the page</li>
                                <li>• Check browser console for errors</li>
                            </ul>
                        </div>

                        {connectionTest && (
                            <div className="bg-white p-3 rounded border mb-4">
                                <h4 className="font-medium text-gray-800 mb-2">Connection Test Results:</h4>
                                <div className="text-sm">
                                    <div className={`font-medium ${connectionTest.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                        Status: {connectionTest.status}
                                    </div>
                                    {connectionTest.error && (
                                        <div className="text-red-600">Error: {connectionTest.error}</div>
                                    )}
                                    {connectionTest.health && (
                                        <div className="text-green-600">Backend: {connectionTest.health.status}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={handleRetry}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Retry Connection
                            </button>

                            <button
                                onClick={() => setDebugMode(true)}
                                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                Show Debug Info
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Enhanced Loading State
    const EnhancedLoadingState = () => (
        <div className="space-y-6">
            <PageHeader
                title="Trips Management"
                subtitle={
                    <div className="flex items-center space-x-2">
                        <span>Loading trips...</span>
                        <ConnectionStatus />
                    </div>
                }
            />

            <div className="bg-white rounded-lg shadow border p-8">
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Loading Trips Data
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Connecting to backend at {apiUrl}
                        </p>
                        <ConnectionStatus />
                    </div>

                    <div className="text-xs text-gray-500 text-center">
                        <div>This usually takes just a few seconds...</div>
                        <div className="mt-1">
                            If this takes too long, try refreshing the page
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Show debug panel
    if (debugMode) {
        return (
            <div className="space-y-6">
                <DebugPanel />
                {loading ? <EnhancedLoadingState /> :
                    error ? <EnhancedErrorState /> :
                        <div className="space-y-6">
                            <PageHeader
                                title="Trips Management"
                                subtitle={
                                    <div className="flex items-center space-x-4">
                                        <span>{pagination.total} trips found</span>
                                        <ConnectionStatus />
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                            Debug Mode
                                        </span>
                                    </div>
                                }
                                action={
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={exportTrips}
                                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                        >
                                            <span>Export</span>
                                        </button>
                                        <button
                                            onClick={refreshData}
                                            disabled={refreshing}
                                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                                        >
                                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                            <span>Refresh</span>
                                        </button>
                                        <button
                                            onClick={handleCreateTrip}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>Create Trip</span>
                                        </button>
                                    </div>
                                }
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
                                onViewDetails={handleViewTripDetails}
                            />
                            {pagination.totalPages > 1 && (
                                <Pagination
                                    pagination={pagination}
                                    onPageChange={handlePageChange}
                                    itemName="trips"
                                />
                            )}
                        </div>}
            </div>
        );
    }

    // Main render logic
    if (loading) {
        return <EnhancedLoadingState />;
    }

    if (error) {
        return <EnhancedErrorState />;
    }

    // Success state
    return (
        <div className="space-y-6">
            <PageHeader
                title="Trips Management"
                subtitle={
                    <div className="flex items-center space-x-4">
                        <span>{pagination.total} trips found</span>
                        <ConnectionStatus />
                        <span className="text-xs text-gray-500">
                            Press Ctrl+Shift+D for debug mode
                        </span>
                    </div>
                }
                action={
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={exportTrips}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                        >
                            <span>Export</span>
                        </button>
                        <button
                            onClick={refreshData}
                            disabled={refreshing}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={handleCreateTrip}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Create Trip</span>
                        </button>
                    </div>
                }
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
                onViewDetails={handleViewTripDetails}
            />

            {pagination.totalPages > 1 && (
                <Pagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    itemName="trips"
                />
            )}

            {/* Trip Creation/Edit Modals */}
            <TripModal
                isOpen={showCreateModal}
                onClose={handleCloseModals}
                onSubmit={handleCreateSubmit}
                destinations={destinations}
                schedules={schedules}
                drivers={drivers}
                submitting={submitting}
            />

            <TripModal
                isOpen={showEditModal}
                onClose={handleCloseModals}
                onSubmit={handleEditSubmit}
                destinations={destinations}
                schedules={schedules}
                drivers={drivers}
                initialData={selectedTrip}
                submitting={submitting}
            />

            {/* Connection Status Footer */}
            <div className="text-xs text-gray-500 text-center py-2 border-t">
                <div className="flex items-center justify-center space-x-4">
                    <ConnectionStatus />
                    <span>API: {apiUrl}</span>
                    <span>Last Updated: {new Date().toLocaleTimeString()}</span>
                </div>
            </div>
        </div>
    );
};

export default TripsPage;