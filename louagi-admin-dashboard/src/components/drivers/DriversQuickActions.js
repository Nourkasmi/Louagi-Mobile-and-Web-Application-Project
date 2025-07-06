// src/components/drivers/DriversQuickActions.js - Updated with working Review Pending button
import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import DriverVerificationModal from './DriverVerificationModal';

const DriversQuickActions = ({ refreshDrivers }) => {
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Fetch pending verification count
    const fetchPendingCount = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('louagi_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/users?role=driver&is_verified=false&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Count unverified drivers
                    const unverifiedCount = data.total || 0;
                    setPendingCount(unverifiedCount);
                }
            }
        } catch (error) {
            console.warn('Could not fetch pending verification count:', error);
            setPendingCount(0);
        } finally {
            setLoading(false);
        }
    };

    // Load pending count on component mount
    useEffect(() => {
        fetchPendingCount();
    }, []);

    const handleOpenVerificationModal = () => {
        setShowVerificationModal(true);
    };

    const handleCloseVerificationModal = () => {
        setShowVerificationModal(false);
        // Refresh the pending count after closing modal
        fetchPendingCount();
        // Also refresh the main drivers list if function provided
        if (refreshDrivers) {
            refreshDrivers();
        }
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            {/* Driver Verification */}
            <div className="bg-white rounded-lg shadow border p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Shield className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Driver Verification</h3>
                            <p className="text-sm text-gray-600">Review and approve new driver applications</p>
                        </div>
                    </div>
                    
                    {pendingCount > 0 && (
                        <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {pendingCount} pending
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                        {loading ? (
                            <div className="flex items-center">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                <span>Checking pending verifications...</span>
                            </div>
                        ) : pendingCount > 0 ? (
                            <div className="flex items-center">
                                <AlertTriangle className="w-4 h-4 text-orange-500 mr-2" />
                                <span className="font-medium">{pendingCount}</span>
                                <span className="ml-1">driver{pendingCount !== 1 ? 's' : ''} pending verification</span>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                                <span>All drivers verified</span>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleOpenVerificationModal}
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                            pendingCount > 0 
                                ? 'bg-orange-600 text-white hover:bg-orange-700' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Loading...
                            </>
                        ) : (
                            <>
                                <Shield className="w-4 h-4 mr-2" />
                                {pendingCount > 0 ? 'Review Pending' : 'Review Drivers'}
                            </>
                        )}
                    </button>

                    {pendingCount > 0 && (
                        <div className="text-xs text-orange-600 text-center">
                            ⚠️ Action required: New driver applications need review
                        </div>
                    )}
                </div>
            </div>

            {/* Driver Verification Modal */}
            <DriverVerificationModal
                isOpen={showVerificationModal}
                onClose={handleCloseVerificationModal}
                refreshDrivers={refreshDrivers}
            />
        </div>
    );
};

export default DriversQuickActions;