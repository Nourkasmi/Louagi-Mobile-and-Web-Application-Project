import React, { useState } from 'react';
import { Save } from 'lucide-react';

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

export default ScheduleModal;
