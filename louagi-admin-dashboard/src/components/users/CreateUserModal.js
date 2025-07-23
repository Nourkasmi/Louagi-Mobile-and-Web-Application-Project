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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4" style={{ overflow: 'auto' }}>
            <div className="min-h-screen flex items-center justify-center py-8">
                <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full">
                    {/* Modal Header - Fixed */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Create New User</h2>
                                    <p className="text-blue-100 text-sm">Add a new user to the system</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                disabled={actionLoading?.create}
                                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Modal Body - Scrollable */}
                    <div className="p-6 max-h-96 overflow-y-auto">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Information Card */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <div className="flex items-center space-x-2 mb-4">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                    <div className="md:col-span-2">
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
                                </div>
                            </div>

                            {/* Driver specific fields */}
                            {formData.role === 'driver' && (
                                <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-200">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h3 className="text-lg font-semibold text-gray-900">Driver Information</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                        <div className="md:col-span-2">
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
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Modal Footer - Fixed */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                * Required fields must be completed
                            </p>
                            <div className="flex items-center space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={actionLoading?.create}
                                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={actionLoading?.create}
                                    className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                                >
                                    {actionLoading?.create ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            <span>Creating User...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span>Create User</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateUserModal;