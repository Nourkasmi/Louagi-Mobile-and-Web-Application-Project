import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    MapPin,
    Plus,
    Edit,
    Trash2,
    Search,
    Filter,
    Route,
    Clock,
    DollarSign,
    Zap,
    ToggleLeft,
    ToggleRight,
    Eye,
    Car
} from 'lucide-react';

const DestinationsPage = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [destinations, setDestinations] = useState([]);
    const [stations, setStations] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        isActive: 'all',
        startStation: 'all',
        endStation: 'all'
    });

    // Form state
    const [formData, setFormData] = useState({
        startId: '',
        endId: '',
        distance: '',
        basePrice: '',
        estimatedDuration: '',
        description: '',
        isActive: true
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDestinations();
        fetchStations();
    }, [currentPage, searchTerm, filters]);

    const fetchDestinations = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('louagi_token');
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
                ...(searchTerm && { search: searchTerm }),
                ...(filters.isActive !== 'all' && { isActive: filters.isActive }),
                ...(filters.startStation !== 'all' && { startStation: filters.startStation }),
                ...(filters.endStation !== 'all' && { endStation: filters.endStation })
            });

            const response = await fetch(`/api/destinations?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setDestinations(data.destinations || []);
                setTotalPages(data.totalPages || 1);
            } else {
                console.error('Failed to fetch destinations');
            }
        } catch (error) {
            console.error('Error fetching destinations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStations = async () => {
        try {
            const response = await fetch('/api/stations');
            if (response.ok) {
                const data = await response.json();
                setStations(data.stations || []);
            }
        } catch (error) {
            console.error('Error fetching stations:', error);
        }
    };

    const handleCreateDestination = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormErrors({});

        try {
            const token = localStorage.getItem('louagi_token');
            const response = await fetch('/api/destinations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    distance: parseFloat(formData.distance),
                    basePrice: parseFloat(formData.basePrice),
                    estimatedDuration: parseInt(formData.estimatedDuration)
                })
            });

            if (response.ok) {
                setShowCreateModal(false);
                resetForm();
                fetchDestinations();
            } else {
                const errorData = await response.json();
                setFormErrors({ general: errorData.message || 'Failed to create destination' });
            }
        } catch (error) {
            setFormErrors({ general: 'Network error. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateDestination = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormErrors({});

        try {
            const token = localStorage.getItem('louagi_token');
            const response = await fetch(`/api/destinations/${selectedDestination.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    distance: parseFloat(formData.distance),
                    basePrice: parseFloat(formData.basePrice),
                    estimatedDuration: parseInt(formData.estimatedDuration)
                })
            });

            if (response.ok) {
                setShowEditModal(false);
                resetForm();
                fetchDestinations();
            } else {
                const errorData = await response.json();
                setFormErrors({ general: errorData.message || 'Failed to update destination' });
            }
        } catch (error) {
            setFormErrors({ general: 'Network error. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteDestination = async (destination) => {
        if (!window.confirm(`Are you sure you want to delete the route from ${destination.startStation?.name} to ${destination.endStation?.name}?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('louagi_token');
            const response = await fetch(`/api/destinations/${destination.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchDestinations();
            } else {
                alert('Failed to delete destination');
            }
        } catch (error) {
            alert('Error deleting destination');
        }
    };

    const openEditModal = (destination) => {
        setSelectedDestination(destination);
        setFormData({
            startId: destination.startId,
            endId: destination.endId,
            distance: destination.distance.toString(),
            basePrice: destination.basePrice.toString(),
            estimatedDuration: destination.estimatedDuration.toString(),
            description: destination.description || '',
            isActive: destination.isActive
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            startId: '',
            endId: '',
            distance: '',
            basePrice: '',
            estimatedDuration: '',
            description: '',
            isActive: true
        });
        setFormErrors({});
        setSelectedDestination(null);
    };

    const closeModals = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        resetForm();
    };

    if (loading && destinations.length === 0) {
        return (
            <div className="space-y-6">
                <PageHeader title="Destinations Management" subtitle="Loading..." />
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="large" text="Loading destinations..." />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Destinations Management"
                subtitle="Manage routes and destinations"
                action={
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add Destination</span>
                    </button>
                }
            />

            {/* Search and Filters */}
            <div className="card p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search destinations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field pl-10"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filters.isActive}
                        onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value }))}
                        className="input-field"
                    >
                        <option value="all">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>

                    {/* Start Station Filter */}
                    <select
                        value={filters.startStation}
                        onChange={(e) => setFilters(prev => ({ ...prev, startStation: e.target.value }))}
                        className="input-field"
                    >
                        <option value="all">All Start Stations</option>
                        {stations.map(station => (
                            <option key={station.id} value={station.id}>
                                {station.name} - {station.city}
                            </option>
                        ))}
                    </select>

                    {/* End Station Filter */}
                    <select
                        value={filters.endStation}
                        onChange={(e) => setFilters(prev => ({ ...prev, endStation: e.target.value }))}
                        className="input-field"
                    >
                        <option value="all">All End Stations</option>
                        {stations.map(station => (
                            <option key={station.id} value={station.id}>
                                {station.name} - {station.city}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Destinations List */}
            <div className="card">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Destinations ({destinations.length})
                    </h3>
                </div>

                {destinations.length === 0 ? (
                    <div className="p-8 text-center">
                        <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No destinations found</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Create your first destination to start managing routes
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary mt-4"
                        >
                            Add First Destination
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Route
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Distance
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {destinations.map((destination) => (
                                    <tr key={destination.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                        <MapPin className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {destination.startStation?.name} → {destination.endStation?.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {destination.startStation?.city} to {destination.endStation?.city}
                                                    </div>
                                                    {destination.description && (
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {destination.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <Route className="h-4 w-4 text-gray-400 mr-1" />
                                                {destination.distance} km
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                                                ${destination.basePrice}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center text-sm text-gray-900">
                                                <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                                {destination.estimatedDuration} min
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${destination.isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {destination.isActive ? (
                                                    <>
                                                        <Zap className="h-3 w-3 mr-1" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <ToggleLeft className="h-3 w-3 mr-1" />
                                                        Inactive
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => openEditModal(destination)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDestination(destination)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {(showCreateModal || showEditModal) && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {showCreateModal ? 'Add New Destination' : 'Edit Destination'}
                            </h3>

                            <div>
                                <div className="space-y-4">
                                    {/* Start Station */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Station *
                                        </label>
                                        <select
                                            value={formData.startId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, startId: e.target.value }))}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Select start station</option>
                                            {stations.map(station => (
                                                <option key={station.id} value={station.id}>
                                                    {station.name} - {station.city}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* End Station */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Station *
                                        </label>
                                        <select
                                            value={formData.endId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, endId: e.target.value }))}
                                            className="input-field"
                                            required
                                        >
                                            <option value="">Select end station</option>
                                            {stations.filter(station => station.id !== formData.startId).map(station => (
                                                <option key={station.id} value={station.id}>
                                                    {station.name} - {station.city}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Distance */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Distance (km) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.distance}
                                            onChange={(e) => setFormData(prev => ({ ...prev, distance: e.target.value }))}
                                            className="input-field"
                                            required
                                        />
                                    </div>

                                    {/* Base Price */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Base Price ($) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.basePrice}
                                            onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                                            className="input-field"
                                            required
                                        />
                                    </div>

                                    {/* Estimated Duration */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Estimated Duration (minutes) *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.estimatedDuration}
                                            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                                            className="input-field"
                                            required
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            className="input-field"
                                            rows="3"
                                            placeholder="Optional route description..."
                                        />
                                    </div>

                                    {/* Is Active */}
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isActive"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                                            Active destination
                                        </label>
                                    </div>
                                </div>

                                {/* Error Display */}
                                {formErrors.general && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-sm text-red-600">{formErrors.general}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={closeModals}
                                        className="btn-secondary"
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={showCreateModal ? handleCreateDestination : handleUpdateDestination}
                                        className="btn-primary"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Saving...' : (showCreateModal ? 'Create' : 'Update')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DestinationsPage;