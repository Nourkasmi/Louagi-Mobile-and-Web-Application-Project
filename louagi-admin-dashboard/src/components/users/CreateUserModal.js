// src/components/users/CreateUserModal.js
import React, { useState } from 'react';
import { X } from 'lucide-react';

const CreateUserModal = ({ onClose, onCreateUser, actionLoading }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        phone: '',
        role: 'passenger',
        license_no: '',
        experience: 0,
        license_expiry: ''
    });

    const [formErrors, setFormErrors] = useState({});

    const validateForm = () => {
        const errors = {};

        // Username validation
        if (!formData.username.trim()) {
            errors.username = 'Username is required';
        } else if (formData.username.trim().length < 3) {
            errors.username = 'Username must be at least 3 characters';
        }

        // Email validation
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        // Phone validation
        if (!formData.phone.trim()) {
            errors.phone = 'Phone number is required';
        }

        // Driver specific validations
        if (formData.role === 'driver') {
            if (!formData.license_no.trim()) {
                errors.license_no = 'License number is required for drivers';
            }
            if (!formData.license_expiry) {
                errors.license_expiry = 'License expiry date is required for drivers';
            }
            if (!formData.experience || formData.experience < 0) {
                errors.experience = 'Experience must be a positive number';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('🔄 Form submitted with data:', formData);

        // Validate form
        if (!validateForm()) {
            console.log('❌ Form validation failed:', formErrors);
            return;
        }

        try {
            console.log('📤 Calling onCreateUser...');
            const result = await onCreateUser(formData);
            console.log('📥 Create user result:', result);

            if (result && result.success) {
                console.log('✅ User created successfully, closing modal');
                onClose();
            } else {
                console.log('❌ User creation failed:', result);
                // Error is already shown by the hook via toast
            }
        } catch (error) {
            console.error('❌ Error in form submission:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error for this field when user starts typing
        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleRoleChange = (role) => {
        console.log('🔄 Role changed to:', role);
        setFormData(prev => ({
            ...prev,
            role,
            ...(role !== 'driver' && {
                license_no: '',
                experience: 0,
                license_expiry: ''
            })
        }));

        // Clear driver-related errors when switching away from driver
        if (role !== 'driver') {
            setFormErrors(prev => ({
                ...prev,
                license_no: '',
                experience: '',
                license_expiry: ''
            }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => handleInputChange('username', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.username ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="johndoe"
                                autoComplete="off"
                            />
                            {formErrors.username && <p className="text-red-500 text-xs mt-1">{formErrors.username}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="john@example.com"
                                autoComplete="off"
                            />
                            {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="Password123"
                                autoComplete="new-password"
                            />
                            {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                            {!formErrors.password && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Password must be at least 8 characters with uppercase, lowercase, and number
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                placeholder="+21612345678"
                                autoComplete="off"
                            />
                            {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                            <select
                                value={formData.role}
                                onChange={(e) => handleRoleChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="passenger">Passenger</option>
                                <option value="driver">Driver</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        {/* Driver specific fields */}
                        {formData.role === 'driver' && (
                            <div className="space-y-4 border-t pt-4">
                                <h4 className="text-sm font-medium text-gray-700">Driver Information</h4>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                                    <input
                                        type="text"
                                        value={formData.license_no}
                                        onChange={(e) => handleInputChange('license_no', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.license_no ? 'border-red-500' : 'border-gray-300'}`}
                                        placeholder="DRV-123456"
                                        autoComplete="off"
                                    />
                                    {formErrors.license_no && <p className="text-red-500 text-xs mt-1">{formErrors.license_no}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years) *</label>
                                    <input
                                        type="number"
                                        value={formData.experience}
                                        onChange={(e) => handleInputChange('experience', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.experience ? 'border-red-500' : 'border-gray-300'}`}
                                        min="0"
                                        max="50"
                                        placeholder="5"
                                        autoComplete="off"
                                    />
                                    {formErrors.experience && <p className="text-red-500 text-xs mt-1">{formErrors.experience}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry Date *</label>
                                    <input
                                        type="date"
                                        value={formData.license_expiry}
                                        onChange={(e) => handleInputChange('license_expiry', e.target.value)}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.license_expiry ? 'border-red-500' : 'border-gray-300'}`}
                                        min={new Date().toISOString().split('T')[0]}
                                        autoComplete="off"
                                    />
                                    {formErrors.license_expiry && <p className="text-red-500 text-xs mt-1">{formErrors.license_expiry}</p>}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={actionLoading?.create}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={actionLoading?.create}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {actionLoading?.create ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Creating...
                                    </div>
                                ) : (
                                    'Create User'
                                )}
                            </button>
                        </div>
                    </form>


                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;