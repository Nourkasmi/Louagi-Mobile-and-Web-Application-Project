// src/components/trips/TripModal.js
import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, DollarSign, Users, MapPin } from 'lucide-react';

const TripModal = ({
    isOpen,
    onClose,
    onSubmit,
    destinations,
    schedules,
    drivers,
    initialData = null,
    submitting = false
}) => {
    const [formData, setFormData] = useState({
        routeId: '',
        scheduleId: '',
        driverId: '',
        departureTime: '',
        estimatedArrivalTime: '',
        basePrice: '',
        currentPrice: '',
        capacity: '',
        notes: '',
        status: 'scheduled'
    });

    const [formErrors, setFormErrors] = useState({});

    const isEditMode = Boolean(initialData);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    routeId: initialData.routeId || '',
                    scheduleId: initialData.scheduleId || '',
                    driverId: initialData.driverId || '',
                    departureTime: formatDateTimeForInput(initialData.departureTime),
                    estimatedArrivalTime: formatDateTimeForInput(initialData.estimatedArrivalTime),
                    basePrice: initialData.basePrice?.toString() || '',
                    currentPrice: initialData.currentPrice?.toString() || '',
                    capacity: initialData.capacity?.toString() || '',
                    notes: initialData.notes || '',
                    status: initialData.status || 'scheduled'
                });
            } else {
                setFormData({
                    routeId: '',
                    scheduleId: '',
                    driverId: '',
                    departureTime: '',
                    estimatedArrivalTime: '',
                    basePrice: '',
                    currentPrice: '',
                    capacity: '',
                    notes: '',
                    status: 'scheduled'
                });
            }
            setFormErrors({});
        }
    }, [isOpen, initialData]);

    const formatDateTimeForInput = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
        } catch {
            return '';
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.routeId) {
            errors.routeId = 'Destination is required';
        }

        if (!formData.scheduleId) {
            errors.scheduleId = 'Schedule is required';
        }

        if (!formData.driverId) {
            errors.driverId = 'Driver is required';
        }

        if (!formData.departureTime) {
            errors.departureTime = 'Departure time is required';
        }

        if (!formData.estimatedArrivalTime) {
            errors.estimatedArrivalTime = 'Estimated arrival time is required';
        }

        if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
            errors.basePrice = 'Base price must be a positive number';
        }

        if (!formData.currentPrice || parseFloat(formData.currentPrice) <= 0) {
            errors.currentPrice = 'Current price must be a positive number';
        }

        if (!formData.capacity || parseInt(formData.capacity) <= 0) {
            errors.capacity = 'Capacity must be a positive number';
        }

        // Validate departure time is not in the past (for new trips)
        if (!isEditMode && formData.departureTime) {
            const departureDate = new Date(formData.departureTime);
            const now = new Date();
            if (departureDate <= now) {
                errors.departureTime = 'Departure time must be in the future';
            }
        }

        // Validate arrival time is after departure time
        if (formData.departureTime && formData.estimatedArrivalTime) {
            const departure = new Date(formData.departureTime);
            const arrival = new Date(formData.estimatedArrivalTime);
            if (arrival <= departure) {
                errors.estimatedArrivalTime = 'Arrival time must be after departure time';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const result = await onSubmit(formData);
            if (result && result.success) {
                onClose();
            }
        } catch (error) {
            console.error('Form submission error:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error for this field when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }

        // Auto-calculate current price when base price changes
        if (field === 'basePrice' && value) {
            const basePrice = parseFloat(value);
            if (!isNaN(basePrice)) {
                const currentPrice = (basePrice * 1.2).toFixed(2); // 20% markup
                setFormData(prev => ({ ...prev, currentPrice }));
            }
        }

        // Auto-calculate arrival time when departure changes or route changes
        if ((field === 'departureTime' || field === 'routeId') && formData.departureTime && formData.routeId) {
            const destination = destinations.find(d => d.id === (field === 'routeId' ? value : formData.routeId));
            if (destination && destination.estimatedDuration) {
                const departure = new Date(field === 'departureTime' ? value : formData.departureTime);
                const arrival = new Date(departure.getTime() + destination.estimatedDuration * 60000);
                setFormData(prev => ({ 
                    ...prev, 
                    estimatedArrivalTime: arrival.toISOString().slice(0, 16)
                }));
            }
        }

        // Auto-set capacity when driver changes
        if (field === 'driverId' && value) {
            const driver = drivers.find(d => d.id === value);
            if (driver && driver.vehicleCapacity) {
                setFormData(prev => ({ ...prev, capacity: driver.vehicleCapacity.toString() }));
            }
        }
    };

    const handleClose = () => {
        if (!submitting) {
            onClose();
        }
    };

    // Get filtered schedules based on selected destination
    const getFilteredSchedules = () => {
        if (!formData.routeId) return schedules;
        const destination = destinations.find(d => d.id === formData.routeId);
        if (!destination) return schedules;
        return schedules.filter(s => s.stationId === destination.startId);
    };

    // Get available drivers (those without active trips)
    const getAvailableDrivers = () => {
        return drivers.filter(driver => {
            // Add any business logic to filter available drivers
            return driver.isActive && driver.isVerified;
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-end md:items-center justify-center">
            {/* Key: Add scroll and max height to the modal content box */}
            <div
                className="
                    relative
                    w-full
                    max-w-4xl
                    bg-white
                    rounded-t-2xl
                    md:rounded-2xl
                    shadow-lg
                    p-5
                    max-h-[95vh]
                    overflow-y-auto
                    mx-auto
                "
                style={{
                    boxSizing: 'border-box',
                    maxHeight: '95vh',
                    overflowY: 'auto',
                }}
            >
                <div className="mt-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900">
                                    {isEditMode ? 'Edit Trip' : 'Create New Trip'}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {isEditMode ? 'Update trip details' : 'Schedule a new trip for passengers'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={submitting}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Route and Schedule Section */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <MapPin className="w-5 h-5 mr-2 text-green-600" />
                                Route & Schedule
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Destination Route *
                                    </label>
                                    <select
                                        value={formData.routeId}
                                        onChange={(e) => handleInputChange('routeId', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            formErrors.routeId ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        required
                                        disabled={submitting}
                                    >
                                        <option value="">Select destination</option>
                                        {destinations.map(destination => (
                                            <option key={destination.id} value={destination.id}>
                                                {destination.startStation?.name} → {destination.endStation?.name}
                                                {destination.description && ` (${destination.description})`}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.routeId && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.routeId}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Schedule *
                                    </label>
                                    <select
                                        value={formData.scheduleId}
                                        onChange={(e) => handleInputChange('scheduleId', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            formErrors.scheduleId ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        required
                                        disabled={submitting}
                                    >
                                        <option value="">Select schedule</option>
                                        {getFilteredSchedules().map(schedule => (
                                            <option key={schedule.id} value={schedule.id}>
                                                {schedule.station?.name} - {schedule.startTime} to {schedule.endTime}
                                            </option>
                                        ))}
                                    </select>
                                    {formErrors.scheduleId && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.scheduleId}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Driver Section */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-purple-600" />
                                Driver Assignment
                            </h4>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Assigned Driver *
                                </label>
                                <select
                                    value={formData.driverId}
                                    onChange={(e) => handleInputChange('driverId', e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        formErrors.driverId ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                    disabled={submitting}
                                >
                                    <option value="">Select driver</option>
                                    {getAvailableDrivers().map(driver => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.name} - {driver.vehicleType} ({driver.vehicleCapacity} seats)
                                        </option>
                                    ))}
                                </select>
                                {formErrors.driverId && (
                                    <p className="text-red-500 text-xs mt-1">{formErrors.driverId}</p>
                                )}
                            </div>
                        </div>

                        {/* Timing Section */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                                Trip Timing
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Departure Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.departureTime}
                                        onChange={(e) => handleInputChange('departureTime', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            formErrors.departureTime ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        required
                                        disabled={submitting}
                                    />
                                    {formErrors.departureTime && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.departureTime}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estimated Arrival Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={formData.estimatedArrivalTime}
                                        onChange={(e) => handleInputChange('estimatedArrivalTime', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            formErrors.estimatedArrivalTime ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        required
                                        disabled={submitting}
                                    />
                                    {formErrors.estimatedArrivalTime && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.estimatedArrivalTime}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Capacity Section */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                Pricing & Capacity
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Base Price ($) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.basePrice}
                                        onChange={(e) => handleInputChange('basePrice', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            formErrors.basePrice ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="15.75"
                                        required
                                        disabled={submitting}
                                    />
                                    {formErrors.basePrice && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.basePrice}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Price ($) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.currentPrice}
                                        onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            formErrors.currentPrice ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="18.90"
                                        required
                                        disabled={submitting}
                                    />
                                    {formErrors.currentPrice && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.currentPrice}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Capacity (seats) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={formData.capacity}
                                        onChange={(e) => handleInputChange('capacity', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            formErrors.capacity ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="4"
                                        required
                                        disabled={submitting}
                                    />
                                    {formErrors.capacity && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors.capacity}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notes & Status Section */}
                        <div className="bg-gray-50 rounded-lg p-5">
                            <h4 className="font-semibold text-gray-900 mb-4">Additional Information</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="3"
                                        placeholder="Additional notes about this trip..."
                                        disabled={submitting}
                                    />
                                </div>

                                {isEditMode && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Trip Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => handleInputChange('status', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={submitting}
                                        >
                                            <option value="scheduled">Scheduled</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-6 border-t">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        {isEditMode ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {isEditMode ? 'Update Trip' : 'Create Trip'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TripModal;
