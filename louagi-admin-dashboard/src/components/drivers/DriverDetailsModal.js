// src/components/drivers/DriverDetailsModal.js
import React from 'react';
import {
    X,
    Car,
    Star,
    Shield,
    Phone,
    Mail,
    Calendar,
    MapPin,
    Clock,
    DollarSign,
    User,
    FileText,
    CheckCircle,
    XCircle,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';

const DriverDetailsModal = ({ driver, onClose, onToggleStatus }) => {
    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'N/A';
        }
    };

    const formatDateTime = (dateString) => {
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'N/A';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'waiting': return 'bg-yellow-100 text-yellow-800';
            case 'on_trip': return 'bg-green-100 text-green-800';
            case 'offline': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getVerificationBadge = () => {
        if (driver.isVerified) {
            return (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <Shield className="w-4 h-4 mr-1" />
                    Verified
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <XCircle className="w-4 h-4 mr-1" />
                Not Verified
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <Car className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Driver Details</h2>
                                <p className="text-blue-100 text-sm">{driver.name}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Driver Overview */}
                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <User className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{driver.name}</h3>
                                    <p className="text-gray-600">{driver.email}</p>
                                    <div className="flex items-center space-x-3 mt-2">
                                        {getVerificationBadge()}
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            driver.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {driver.isActive ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
                                            {driver.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center text-gray-600 mb-1">
                                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                    <span className="font-medium">{driver.rating}</span>
                                </div>
                                <div className="text-sm text-gray-500">{driver.totalTrips} trips completed</div>
                            </div>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="bg-white border rounded-lg p-5">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2 text-blue-600" />
                                Personal Information
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <Mail className="w-4 h-4 text-gray-400 mr-3" />
                                    <div>
                                        <span className="text-sm text-gray-500">Email</span>
                                        <p className="font-medium">{driver.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Phone className="w-4 h-4 text-gray-400 mr-3" />
                                    <div>
                                        <span className="text-sm text-gray-500">Phone</span>
                                        <p className="font-medium">{driver.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                                    <div>
                                        <span className="text-sm text-gray-500">Joined Date</span>
                                        <p className="font-medium">{formatDate(driver.joinedDate)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 text-gray-400 mr-3" />
                                    <div>
                                        <span className="text-sm text-gray-500">Last Active</span>
                                        <p className="font-medium">{formatDateTime(driver.lastActive)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* License Information */}
                        <div className="bg-white border rounded-lg p-5">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <FileText className="w-5 h-5 mr-2 text-green-600" />
                                License Information
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm text-gray-500">License Number</span>
                                    <p className="font-medium">{driver.licenseNo}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Experience</span>
                                    <p className="font-medium">{driver.experience} years</p>
                                </div>
                                {driver.licenseExpiry && (
                                    <div>
                                        <span className="text-sm text-gray-500">License Expiry</span>
                                        <p className="font-medium">{formatDate(driver.licenseExpiry)}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-sm text-gray-500">Verification Status</span>
                                    <div className="mt-1">
                                        {getVerificationBadge()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Information */}
                        <div className="bg-white border rounded-lg p-5">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <Car className="w-5 h-5 mr-2 text-purple-600" />
                                Vehicle Information
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-sm text-gray-500">Vehicle Type</span>
                                    <p className="font-medium">{driver.vehicleType}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Capacity</span>
                                    <p className="font-medium">{driver.vehicleCapacity} seats</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Current Status</span>
                                    <div className="mt-1">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.currentStatus)}`}>
                                            {driver.currentStatus.replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                {driver.queuePosition && (
                                    <div>
                                        <span className="text-sm text-gray-500">Queue Position</span>
                                        <p className="font-medium">#{driver.queuePosition}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="bg-white border rounded-lg p-5">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <Star className="w-5 h-5 mr-2 text-yellow-600" />
                                Performance Metrics
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Rating</span>
                                    <div className="flex items-center">
                                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                                        <span className="font-medium">{driver.rating}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Total Trips</span>
                                    <span className="font-medium">{driver.totalTrips}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Total Earnings</span>
                                    <div className="flex items-center">
                                        <DollarSign className="w-4 h-4 text-green-500 mr-1" />
                                        <span className="font-medium text-green-600">${driver.totalEarnings.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Avg per Trip</span>
                                    <span className="font-medium">
                                        ${driver.totalTrips > 0 ? (driver.totalEarnings / driver.totalTrips).toFixed(2) : '0.00'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="bg-gray-50 rounded-lg p-5 mt-6">
                        <h4 className="font-semibold text-gray-900 mb-4">Account Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">User ID</span>
                                <p className="font-mono text-xs bg-white px-2 py-1 rounded mt-1">{driver.id}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Created</span>
                                <p className="font-medium">{formatDateTime(driver.joinedDate)}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Last Updated</span>
                                <p className="font-medium">{formatDateTime(driver.lastActive)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
                        <button
                            onClick={() => onToggleStatus(driver.id, driver.isActive)}
                            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                                driver.isActive
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                        >
                            {driver.isActive ? <ToggleRight className="w-4 h-4 mr-2" /> : <ToggleLeft className="w-4 h-4 mr-2" />}
                            {driver.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverDetailsModal;