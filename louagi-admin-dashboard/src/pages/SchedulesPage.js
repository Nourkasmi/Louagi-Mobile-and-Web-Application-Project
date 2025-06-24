// src/pages/SchedulesPage.js
import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    MapPin,
    Plus,
    Edit,
    Trash2,
    Eye,
    Search,
    RefreshCw,
    AlertCircle,
    Filter,
    Check,
    X,
    Save,
    Users
} from 'lucide-react';

const SchedulesPage = () => {
    const [schedules, setSchedules] = useState([]);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        stationId: '',
        dayOfWeek: '',
        isActive: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    // Days of week mapping
    const daysOfWeek = [
        { value: 0, label: 'Sunday' },
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' }
    ];

    const getDayName = (dayNumber) => {
        return daysOfWeek.find(day => day.value === dayNumber)?.label || 'Unknown';
    };

    useEffect(() => {
        fetchSchedules();
        fetchStations();
    }, [pagination.page, filters]);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const params = new URLSearchParams();
            if (filters.search) params.append('search', filters.search);
            if (filters.stationId) params.append('stationId', filters.stationId);
            if (filters.dayOfWeek !== '') params.append('dayOfWeek', filters.dayOfWeek);
            if (filters.isActive !== '') params.append('isActive', filters.isActive);
            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${baseUrl}/schedules?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setSchedules(data.schedules || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    totalPages: data.totalPages || 0
                }));
            } else {
                throw new Error('Failed to fetch schedules');
            }
        } catch (err) {
            console.error('Error fetching schedules:', err);
            setError(err.message || 'Failed to fetch schedules');
        } finally {
            setLoading(false);
        }
    };

    const fetchStations = async () => {
        try {
            const token = localStorage.getItem('louagi_token');
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseUrl}/stations`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setStations(data.stations || []);
                }
            }
        } catch (err) {
            console.error('Error fetching stations:', err);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const deleteSchedule = async (scheduleId, stationName) => {
        if (!window.confirm(`Are you sure you want to delete the schedule for "${stationName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('louagi_token');
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const response = await fetch(`${baseUrl}/schedules/${scheduleId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setSchedules(schedules.filter(schedule => schedule.id !== scheduleId));
                setPagination(prev => ({ ...prev, total: prev.total - 1 }));
                alert('Schedule deleted successfully!');
            } else {
                alert('Failed to delete schedule: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error deleting schedule:', err);
            alert('Error deleting schedule: ' + err.message);
        }
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        } catch {
            return timeString;
        }
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    if (loading && schedules.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading schedules...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Schedules Management</h1>
                        <p className="mt-1 text-sm text-gray-600">Manage station schedules and operating hours</p>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error Loading Schedules</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <p className="text-xs text-red-600 mt-2">
                                Make sure your backend is running on {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                            </p>
                            <button
                                onClick={fetchSchedules}
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
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2 inline" />
                        Create Schedule
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow border">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Search schedules..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <select
                            value={filters.stationId}
                            onChange={(e) => handleFilterChange('stationId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Stations</option>
                            {stations.map(station => (
                                <option key={station.id} value={station.id}>
                                    {station.name} - {station.city}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={filters.dayOfWeek}
                            onChange={(e) => handleFilterChange('dayOfWeek', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Days</option>
                            {daysOfWeek.map(day => (
                                <option key={day.value} value={day.value}>
                                    {day.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={filters.isActive}
                            onChange={(e) => handleFilterChange('isActive', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Schedules List */}
            <div className="space-y-4">
                {schedules.length === 0 ? (
                    <div className="bg-white rounded-lg shadow border p-8 text-center">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
                        <p className="text-gray-600">
                            {Object.values(filters).some(f => f)
                                ? 'Try adjusting your filters to see more schedules.'
                                : 'No schedules have been created yet.'}
                        </p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create First Schedule
                        </button>
                    </div>
                ) : (
                    schedules.map((schedule) => (
                        <div key={schedule.id} className="bg-white rounded-lg shadow border p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-4 mb-3">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {schedule.station?.name || 'Unknown Station'} - {schedule.station?.city}
                                        </h3>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(schedule.isActive)}`}>
                                            {schedule.isActive ? (
                                                <>
                                                    <Check className="w-3 h-3 mr-1" />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <X className="w-3 h-3 mr-1" />
                                                    Inactive
                                                </>
                                            )}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            <div>
                                                <span className="font-medium">Day:</span><br />
                                                {getDayName(schedule.dayOfWeek)}
                                            </div>
                                        </div>

                                        <div className="flex items-center text-gray-600">
                                            <Clock className="w-4 h-4 mr-2" />
                                            <div>
                                                <span className="font-medium">Hours:</span><br />
                                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                            </div>
                                        </div>

                                        <div className="flex items-center text-gray-600">
                                            <Users className="w-4 h-4 mr-2" />
                                            <div>
                                                <span className="font-medium">Max Trips:</span><br />
                                                {schedule.maxTrips || 10} per day
                                            </div>
                                        </div>

                                        <div className="flex items-center text-gray-600">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            <div>
                                                <span className="font-medium">Station:</span><br />
                                                {schedule.station?.city} - {schedule.station?.state}
                                            </div>
                                        </div>
                                    </div>

                                    {schedule.notes && (
                                        <div className="mt-3 text-sm text-gray-500">
                                            <span className="font-medium">Notes:</span> {schedule.notes}
                                        </div>
                                    )}

                                    <div className="mt-3 text-xs text-gray-400">
                                        Created: {new Date(schedule.createdAt).toLocaleDateString()}
                                        {schedule.updatedAt !== schedule.createdAt && (
                                            <> • Updated: {new Date(schedule.updatedAt).toLocaleDateString()}</>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col space-y-2 ml-4">
                                    <button
                                        onClick={() => setEditingSchedule(schedule)}
                                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                    >
                                        <Edit className="w-3 h-3 mr-1" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => deleteSchedule(schedule.id, schedule.station?.name)}
                                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Delete
                                    </button>
                                    <button className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200">
                                        <Eye className="w-3 h-3 mr-1" />
                                        Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
                    <div className="flex items-center text-sm text-gray-700">
                        <span>
                            Showing page {pagination.page} of {pagination.totalPages}
                            ({pagination.total} total schedules)
                        </span>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {(showCreateModal || editingSchedule) && (
                <ScheduleModal
                    schedule={editingSchedule}
                    stations={stations}
                    daysOfWeek={daysOfWeek}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingSchedule(null);
                    }}
                    onSave={(savedSchedule) => {
                        if (editingSchedule) {
                            setSchedules(schedules.map(s => s.id === savedSchedule.id ? savedSchedule : s));
                        } else {
                            setSchedules([savedSchedule, ...schedules]);
                            setPagination(prev => ({ ...prev, total: prev.total + 1 }));
                        }
                        setShowCreateModal(false);
                        setEditingSchedule(null);
                    }}
                />
            )}

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
            </div>
        </div>
    );
};

// Schedule Create/Edit Modal Component
const ScheduleModal = ({ schedule, stations, daysOfWeek, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        stationId: schedule?.stationId || '',
        dayOfWeek: schedule?.dayOfWeek ?? '',
        startTime: schedule?.startTime || '',
        endTime: schedule?.endTime || '',
        maxTrips: schedule?.maxTrips || 10,
        isActive: schedule?.isActive ?? true,
        notes: schedule?.notes || ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        // Validation
        if (!formData.stationId || formData.dayOfWeek === '' || !formData.startTime || !formData.endTime) {
            setError('Please fill in all required fields');
            setSaving(false);
            return;
        }

        // Check if end time is after start time
        if (formData.startTime >= formData.endTime) {
            setError('End time must be after start time');
            setSaving(false);
            return;
        }

        try {
            const token = localStorage.getItem('louagi_token');
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            const url = schedule
                ? `${baseUrl}/schedules/${schedule.id}`
                : `${baseUrl}/schedules`;

            const method = schedule ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    dayOfWeek: parseInt(formData.dayOfWeek),
                    maxTrips: parseInt(formData.maxTrips)
                })
            });

            const data = await response.json();

            if (data.success) {
                onSave(data.schedule);
                alert(`Schedule ${schedule ? 'updated' : 'created'} successfully!`);
            } else {
                setError(data.message || 'Failed to save schedule');
            }
        } catch (err) {
            console.error('Error saving schedule:', err);
            setError('Failed to save schedule: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {schedule ? 'Edit Schedule' : 'Create New Schedule'}
                    </h3>
                </div>

                <div className="px-6 py-4 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Station *
                        </label>
                        <select
                            value={formData.stationId}
                            onChange={(e) => handleChange('stationId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a station</option>
                            {stations.map(station => (
                                <option key={station.id} value={station.id}>
                                    {station.name} - {station.city}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Day of Week *
                        </label>
                        <select
                            value={formData.dayOfWeek}
                            onChange={(e) => handleChange('dayOfWeek', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a day</option>
                            {daysOfWeek.map(day => (
                                <option key={day.value} value={day.value}>
                                    {day.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time *
                            </label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => handleChange('startTime', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Time *
                            </label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => handleChange('endTime', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Trips per Day
                        </label>
                        <input
                            type="number"
                            value={formData.maxTrips}
                            onChange={(e) => handleChange('maxTrips', e.target.value)}
                            min="1"
                            max="100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Optional notes about this schedule..."
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => handleChange('isActive', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                            Schedule is active
                        </label>
                    </div>
                </div>

                <div className="px-6 py-4 border-t flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                {schedule ? 'Update' : 'Create'} Schedule
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SchedulesPage;
