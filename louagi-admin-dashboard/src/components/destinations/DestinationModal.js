// src/components/destinations/DestinationModal.js
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const DestinationModal = ({
    isOpen,
    onClose,
    onSubmit,
    stations,
    initialData = null,
    submitting = false
}) => {
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

    const isEditMode = Boolean(initialData);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    startId: initialData.startId || '',
                    endId: initialData.endId || '',
                    distance: initialData.distance?.toString() || '',
                    basePrice: initialData.basePrice?.toString() || '',
                    estimatedDuration: initialData.estimatedDuration?.toString() || '',
                    description: initialData.description || '',
                    isActive: initialData.isActive !== undefined ? initialData.isActive : true
                });
            } else {
                setFormData({
                    startId: '',
                    endId: '',
                    distance: '',
                    basePrice: '',
                    estimatedDuration: '',
                    description: '',
                    isActive: true
                });
            }
            setFormErrors({});
        }
    }, [isOpen, initialData]);

    const validateForm = () => {
        const errors = {};

        if (!formData.startId) {
            errors.startId = 'Start station is required';
        }

        if (!formData.endId) {
            errors.endId = 'End station is required';
        }

        if (formData.startId === formData.endId) {
            errors.endId = 'End station must be different from start station';
        }

        if (!formData.distance || parseFloat(formData.distance) <= 0) {
            errors.distance = 'Distance must be a positive number';
        }

        if (!formData.basePrice || parseFloat(formData.basePrice) <= 0) {
            errors.basePrice = 'Base price must be a positive number';
        }

        if (!formData.estimatedDuration || parseInt(formData.estimatedDuration) <= 0) {
            errors.estimatedDuration = 'Duration must be a positive number';
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
    };

    const handleClose = () => {
        if (!submitting) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {isEditMode ? 'Edit Destination' : 'Add New Destination'}
                        </h3>
                        <button
                            onClick={handleClose}
                            disabled={submitting}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Start Station */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Station *
                            </label>
                            <select
                                value={formData.startId}
                                onChange={(e) => handleInputChange('startId', e.target.value)}
                                className={`input-field ${formErrors.startId ? 'border-red-500' : ''}`}
                                required
                                disabled={submitting}
                            >
                                <option value="">Select start station</option>
                                {stations.map(station => (
                                    <option key={station.id} value={station.id}>
                                        {station.name} - {station.city}
                                    </option>
                                ))}
                            </select>
                            {formErrors.startId && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.startId}</p>
                            )}
                        </div>

                        {/* End Station */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Station *
                            </label>
                            <select
                                value={formData.endId}
                                onChange={(e) => handleInputChange('endId', e.target.value)}
                                className={`input-field ${formErrors.endId ? 'border-red-500' : ''}`}
                                required
                                disabled={submitting}
                            >
                                <option value="">Select end station</option>
                                {stations.filter(station => station.id !== formData.startId).map(station => (
                                    <option key={station.id} value={station.id}>
                                        {station.name} - {station.city}
                                    </option>
                                ))}
                            </select>
                            {formErrors.endId && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.endId}</p>
                            )}
                        </div>

                        {/* Distance */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Distance (km) *
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={formData.distance}
                                onChange={(e) => handleInputChange('distance', e.target.value)}
                                className={`input-field ${formErrors.distance ? 'border-red-500' : ''}`}
                                placeholder="25.5"
                                required
                                disabled={submitting}
                            />
                            {formErrors.distance && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.distance}</p>
                            )}
                        </div>

                        {/* Base Price */}
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
                                className={`input-field ${formErrors.basePrice ? 'border-red-500' : ''}`}
                                placeholder="12.50"
                                required
                                disabled={submitting}
                            />
                            {formErrors.basePrice && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.basePrice}</p>
                            )}
                        </div>

                        {/* Estimated Duration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estimated Duration (minutes) *
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.estimatedDuration}
                                onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
                                className={`input-field ${formErrors.estimatedDuration ? 'border-red-500' : ''}`}
                                placeholder="45"
                                required
                                disabled={submitting}
                            />
                            {formErrors.estimatedDuration && (
                                <p className="text-red-500 text-xs mt-1">{formErrors.estimatedDuration}</p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                className="input-field"
                                rows="3"
                                placeholder="Optional route description..."
                                disabled={submitting}
                            />
                        </div>

                        {/* Is Active */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                disabled={submitting}
                            />
                            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                                Active destination
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="btn-secondary"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Saving...
                                    </div>
                                ) : (
                                    isEditMode ? 'Update' : 'Create'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DestinationModal;