import React, { useState, useEffect } from 'react';
import {
    X,
    Shield,
    CheckCircle,
    XCircle,
    AlertTriangle,
    User,
    FileText,
    Car,
    Calendar,
    Eye,
    Download,
    Clock
} from 'lucide-react';

const DriverVerificationModal = ({ isOpen, onClose, onVerify, onReject, refreshDrivers }) => {
    const [pendingDrivers, setPendingDrivers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [selectedDriver, setSelectedDriver] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Fetch pending verification drivers
    const fetchPendingDrivers = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔄 Fetching pending drivers...');

            const response = await fetch(`${API_BASE_URL}/users?role=driver&limit=50`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📥 Response data:', data);

            if (data.success) {
                // Filter for unverified drivers only
                const unverifiedDrivers = data.users
                    .filter(user => user.role === 'driver')
                    .map(user => {
                        const driver = user.driverProfile;

                        // Create driver object even if driverProfile is missing
                        return {
                            id: user.id,
                            name: user.username,
                            email: user.email,
                            phone: user.phone,
                            licenseNo: driver?.license_no || 'N/A',
                            experience: driver?.experience || 0,
                            vehicleType: driver?.vehicle_type || 'Unknown',
                            vehicleCapacity: driver?.vehicle_capacity || 4,
                            licenseExpiry: driver?.license_expiry,
                            isVerified: driver?.is_verified || false,
                            isActive: user.isActive,
                            joinedDate: user.createdAt,
                            driverProfile: user.driverProfile
                        };
                    })
                    .filter(driver => !driver.isVerified); // Only unverified drivers

                setPendingDrivers(unverifiedDrivers);
                console.log('✅ Pending drivers loaded:', unverifiedDrivers.length);
            } else {
                throw new Error('Failed to fetch pending drivers');
            }
        } catch (err) {
            console.error('❌ Error fetching pending drivers:', err);
            setError(err.message || 'Failed to load pending drivers');
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIXED: Handle driver verification with proper API call
    const handleVerifyDriver = async (driverId, approved = true, notes = '') => {
        try {
            setActionLoading(prev => ({ ...prev, [driverId]: true }));

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            console.log('🔄 Verifying driver:', { driverId, approved, notes });

            // ✅ FIX: Use the proper API endpoint and data structure
            const response = await fetch(`${API_BASE_URL}/users/${driverId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    driverProfile: {
                        is_verified: approved,
                        verification_notes: notes,
                        verification_date: new Date().toISOString()
                    }
                })
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📥 Response data:', data);

            if (data.success) {
                // Remove from pending list
                setPendingDrivers(prev => prev.filter(driver => driver.id !== driverId));

                // Show success message
                const action = approved ? 'approved' : 'rejected';
                alert(`Driver verification ${action} successfully!`);

                // Refresh main drivers list if function provided
                if (refreshDrivers) {
                    refreshDrivers();
                }

                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to update driver verification');
            }
        } catch (err) {
            console.error('❌ Error updating driver verification:', err);
            alert('Failed to update driver verification: ' + err.message);
            return { success: false, error: err.message };
        } finally {
            setActionLoading(prev => ({ ...prev, [driverId]: false }));
        }
    };

    // Load pending drivers when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchPendingDrivers();
        }
    }, [isOpen]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
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

    const DriverCard = ({ driver }) => (
        <div className="bg-white border rounded-lg p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
                        <p className="text-sm text-gray-600">{driver.email}</p>
                        <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">
                                License: {driver.licenseNo}
                            </span>
                            <span className="text-xs text-gray-500">
                                Experience: {driver.experience} years
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setSelectedDriver(driver)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                    <Car className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{driver.vehicleType} ({driver.vehicleCapacity} seats)</span>
                </div>
                <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Joined: {formatDate(driver.joinedDate)}</span>
                </div>
                <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-gray-400" />
                    <span>License Expires: {formatDate(driver.licenseExpiry)}</span>
                </div>
                <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Pending Review</span>
                </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
                <button
                    onClick={() => {
                        const notes = prompt('Add verification notes (optional):');
                        handleVerifyDriver(driver.id, false, notes || 'Rejected by admin');
                    }}
                    disabled={actionLoading[driver.id]}
                    className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                </button>
                <button
                    onClick={() => {
                        const notes = prompt('Add verification notes (optional):');
                        handleVerifyDriver(driver.id, true, notes || 'Approved by admin');
                    }}
                    disabled={actionLoading[driver.id]}
                    className="inline-flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                >
                    {actionLoading[driver.id] ? (
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve
                </button>
            </div>
        </div>
    );

    const DriverDetailsModal = ({ driver, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-blue-600 px-6 py-4 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-white">Driver Verification Details</h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-gray-900">{driver.name}</h4>
                            <p className="text-gray-600">{driver.email}</p>
                            <p className="text-sm text-gray-500">{driver.phone}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <h5 className="font-semibold text-gray-900 mb-2">License Information</h5>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-medium">License Number:</span> {driver.licenseNo}</div>
                                    <div><span className="font-medium">Experience:</span> {driver.experience} years</div>
                                    <div><span className="font-medium">Expires:</span> {formatDate(driver.licenseExpiry)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h5 className="font-semibold text-gray-900 mb-2">Vehicle Information</h5>
                                <div className="space-y-2 text-sm">
                                    <div><span className="font-medium">Type:</span> {driver.vehicleType}</div>
                                    <div><span className="font-medium">Capacity:</span> {driver.vehicleCapacity} passengers</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h6 className="font-medium text-yellow-800">Verification Required</h6>
                                <p className="text-sm text-yellow-700 mt-1">
                                    Please review all driver information and documentation before approving or rejecting this application.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={() => {
                                const notes = prompt('Add rejection notes:');
                                if (notes) {
                                    handleVerifyDriver(driver.id, false, notes);
                                    onClose();
                                }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Reject Application
                        </button>
                        <button
                            onClick={() => {
                                const notes = prompt('Add approval notes (optional):');
                                handleVerifyDriver(driver.id, true, notes || 'Approved by admin');
                                onClose();
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Approve Driver
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Driver Verification Review</h2>
                                <p className="text-blue-100 text-sm">
                                    {pendingDrivers.length} driver{pendingDrivers.length !== 1 ? 's' : ''} pending verification
                                </p>
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
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Loading pending drivers...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">Error Loading Drivers</h3>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                    <button
                                        onClick={fetchPendingDrivers}
                                        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : pendingDrivers.length === 0 ? (
                        <div className="text-center py-12">
                            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Verifications</h3>
                            <p className="text-gray-500">All drivers have been verified or no new applications are pending.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                <h3 className="font-medium text-blue-900 mb-2">Verification Guidelines</h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Verify license number and expiration date</li>
                                    <li>• Check driving experience matches requirements</li>
                                    <li>• Ensure vehicle information is accurate</li>
                                    <li>• Contact driver if additional documentation is needed</li>
                                </ul>
                            </div>

                            {pendingDrivers.map((driver) => (
                                <DriverCard key={driver.id} driver={driver} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {pendingDrivers.length > 0 ?
                                `${pendingDrivers.length} driver${pendingDrivers.length !== 1 ? 's' : ''} awaiting review` :
                                'No pending verifications'
                            }
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Driver Details Modal */}
                {selectedDriver && (
                    <DriverDetailsModal
                        driver={selectedDriver}
                        onClose={() => setSelectedDriver(null)}
                    />
                )}
            </div>
        </div>
    );
};

export default DriverVerificationModal;