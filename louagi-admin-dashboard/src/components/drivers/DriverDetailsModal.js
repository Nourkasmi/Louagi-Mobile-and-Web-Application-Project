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
    Activity // ⬅️ Add this!
} from 'lucide-react';

const DriverDetailsModal = ({ driver, onClose }) => {
    if (!driver) return null;

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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4" style={{ overflow: 'auto' }}>
            <div className="min-h-screen flex items-center justify-center py-8">
                <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full flex flex-col">
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <Car className="w-5 h-5 text-white" />
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

                    {/* Modal Body (scrollable if needed) */}
                    <div className="p-6" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        {/* Status Banner */}
                        <div className={`mb-6 p-4 rounded-lg border ${
                            driver.isActive
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                        }`}>
                            <div className="flex items-center">
                                {driver.isActive ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                )}
                                <span className={`font-medium ${
                                    driver.isActive ? 'text-green-800' : 'text-red-800'
                                }`}>
                                    Driver is {driver.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        {/* Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            {/* Personal Info */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <User className="w-5 h-5 mr-2 text-blue-600" />
                                    Personal Information
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Name:</span>
                                        <p className="text-gray-900">{driver.name}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Email:</span>
                                        <p className="text-gray-900">{driver.email}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Phone:</span>
                                        <p className="text-gray-900">{driver.phone}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Joined Date:</span>
                                        <p className="text-gray-900">{formatDate(driver.joinedDate)}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Last Active:</span>
                                        <p className="text-gray-900">{formatDateTime(driver.lastActive)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* License Info */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                                    License Information
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">License Number:</span>
                                        <p className="text-gray-900">{driver.licenseNo}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Experience:</span>
                                        <p className="text-gray-900">{driver.experience} years</p>
                                    </div>
                                    {driver.licenseExpiry && (
                                        <div>
                                            <span className="font-medium text-gray-700">License Expiry:</span>
                                            <p className="text-gray-900">{formatDate(driver.licenseExpiry)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-medium text-gray-700">Verification:</span>
                                        <div className="mt-1">{getVerificationBadge()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Info */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Car className="w-5 h-5 mr-2 text-purple-600" />
                                    Vehicle Information
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Vehicle Type:</span>
                                        <p className="text-gray-900">{driver.vehicleType}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Capacity:</span>
                                        <p className="text-gray-900">{driver.vehicleCapacity} seats</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Current Status:</span>
                                        <span className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(driver.currentStatus)}`}>
                                            {(driver.currentStatus || 'offline').replace('_', ' ').toUpperCase()}
                                        </span>
                                    </div>
                                    {driver.queuePosition && (
                                        <div>
                                            <span className="font-medium text-gray-700">Queue Position:</span>
                                            <p className="text-gray-900 font-mono text-xs">#{driver.queuePosition}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Performance/Stats */}
                        <div className="bg-blue-50 rounded-lg p-5 mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Star className="w-5 h-5 mr-2 text-yellow-600" />
                                Performance
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">Rating:</span>
                                    <span className="ml-2 font-semibold">{driver.rating}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Total Trips:</span>
                                    <span className="ml-2 font-semibold">{driver.totalTrips}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Total Earnings:</span>
                                    <span className="ml-2 font-semibold text-green-700">${driver.totalEarnings?.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Avg/Trip:</span>
                                    <span className="ml-2 font-semibold">
                                        ${driver.totalTrips > 0 ? (driver.totalEarnings / driver.totalTrips).toFixed(2) : '0.00'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="bg-gray-50 rounded-lg p-5 mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-gray-600" />
                                Driver Metadata
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">User ID:</span>
                                    <p className="text-gray-900 font-mono text-xs">{driver.id}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Joined:</span>
                                    <p className="text-gray-900">{formatDateTime(driver.joinedDate)}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Last Updated:</span>
                                    <p className="text-gray-900">{formatDateTime(driver.lastActive)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer (only Close button) */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex items-center justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
