import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    User,
    Car,
    FileText,
    Phone,
    Mail,
    Calendar,
    Shield
} from 'lucide-react';

const EditDriverModal = ({ driver, onClose, onSave, actionLoading = false }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        license_no: '',
        experience: 0,
        license_expiry: '',
        vehicle_type: '',
        vehicle_capacity: 4,
        is_verified: false,
        isActive: true
    });

    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    // Populate form with driver data
    useEffect(() => {
        if (driver) {
            setFormData({
                username: driver.name || '',
                email: driver.email || '',
                phone: driver.phone || '',
                license_no: driver.licenseNo || '',
                experience: driver.experience || 0,
                license_expiry: driver.licenseExpiry ? driver.licenseExpiry.split('T')[0] : '',
                vehicle_type: driver.vehicleType || '',
                vehicle_capacity: driver.vehicleCapacity || 4,
                is_verified: driver.isVerified || false,
                isActive: driver.isActive !== undefined ? driver.isActive : true
            });
        }
    }, [driver]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Name is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone is required';
        }
        if (!formData.license_no.trim()) {
            newErrors.license_no = 'License number is required';
        }
        if (!formData.experience || formData.experience < 0) {
            newErrors.experience = 'Experience must be a positive number';
        }
        if (!formData.vehicle_type.trim()) {
            newErrors.vehicle_type = 'Vehicle type is required';
        }
        if (!formData.vehicle_capacity || formData.vehicle_capacity < 1) {
            newErrors.vehicle_capacity = 'Vehicle capacity must be at least 1';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSaving(true);
        try {
            // Prepare update data
            const updateData = {
                username: formData.username.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                isActive: formData.isActive,
                driverProfile: {
                    license_no: formData.license_no.trim(),
                    experience: parseInt(formData.experience),
                    license_expiry: formData.license_expiry || null,
                    vehicle_type: formData.vehicle_type.trim(),
                    vehicle_capacity: parseInt(formData.vehicle_capacity),
                    is_verified: formData.is_verified
                }
            };
            const result = await onSave(driver.id, updateData);
            if (result && result.success) onClose();
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4" style={{ overflow: 'auto' }}>
            <div className="min-h-screen flex items-center justify-center py-8">
                <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full flex flex-col">
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Edit Driver</h2>
                                    <p className="text-blue-100 text-sm">{driver?.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-blue-600" />
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.username}
                                            onChange={(e) => handleInputChange('username', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
                                            disabled={saving}
                                        />
                                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email *
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => handleInputChange('email', e.target.value)}
                                                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                                disabled={saving}
                                            />
                                        </div>
                                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone *
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                                disabled={saving}
                                            />
                                        </div>
                                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="isActive"
                                                checked={formData.isActive}
                                                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                disabled={saving}
                                            />
                                            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                                                Account is active
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* License Information */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                                    License Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            License Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.license_no}
                                            onChange={(e) => handleInputChange('license_no', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.license_no ? 'border-red-500' : 'border-gray-300'}`}
                                            disabled={saving}
                                        />
                                        {errors.license_no && <p className="text-red-500 text-xs mt-1">{errors.license_no}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Experience (years) *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            value={formData.experience}
                                            onChange={(e) => handleInputChange('experience', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.experience ? 'border-red-500' : 'border-gray-300'}`}
                                            disabled={saving}
                                        />
                                        {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            License Expiry Date
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="date"
                                                value={formData.license_expiry}
                                                onChange={(e) => handleInputChange('license_expiry', e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                disabled={saving}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="is_verified"
                                                checked={formData.is_verified}
                                                onChange={(e) => handleInputChange('is_verified', e.target.checked)}
                                                className="h-4 w-4 text-green-600 border-gray-300 rounded"
                                                disabled={saving}
                                            />
                                            <label htmlFor="is_verified" className="ml-2 text-sm text-gray-700 flex items-center">
                                                <Shield className="w-4 h-4 mr-1 text-green-600" />
                                                Driver is verified
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Information */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                    <Car className="w-5 h-5 mr-2 text-purple-600" />
                                    Vehicle Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vehicle Type *
                                        </label>
                                        <select
                                            value={formData.vehicle_type}
                                            onChange={(e) => handleInputChange('vehicle_type', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.vehicle_type ? 'border-red-500' : 'border-gray-300'}`}
                                            disabled={saving}
                                        >
                                            <option value="">Select vehicle type</option>
                                            <option value="Sedan">Sedan</option>
                                            <option value="SUV">SUV</option>
                                            <option value="Minivan">Minivan</option>
                                            <option value="Van">Van</option>
                                            <option value="Bus">Bus</option>
                                        </select>
                                        {errors.vehicle_type && <p className="text-red-500 text-xs mt-1">{errors.vehicle_type}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Vehicle Capacity *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="50"
                                            value={formData.vehicle_capacity}
                                            onChange={(e) => handleInputChange('vehicle_capacity', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.vehicle_capacity ? 'border-red-500' : 'border-gray-300'}`}
                                            disabled={saving}
                                        />
                                        {errors.vehicle_capacity && <p className="text-red-500 text-xs mt-1">{errors.vehicle_capacity}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={saving}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditDriverModal;
