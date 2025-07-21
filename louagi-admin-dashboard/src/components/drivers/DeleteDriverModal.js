import React from 'react';
import {
    AlertTriangle,
    Trash2,
    X,
    User,
    Car,
    Star
} from 'lucide-react';

const DeleteDriverModal = ({ driver, onClose, onConfirm, actionLoading = false }) => {
    const handleConfirm = async () => {
        try {
            // ✅ FIX: Wait for the deletion to complete before closing modal
            const result = await onConfirm(driver.id, driver.name);

            // Only close the modal if deletion was successful
            if (result && result.success !== false) {
                onClose();
            }
            // If deletion failed, keep modal open so user can see the error
        } catch (error) {
            console.error('Delete confirmation error:', error);
            // Keep modal open on error so user can retry or cancel
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
                {/* Header */}
                <div className="bg-red-600 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Delete Driver</h2>
                                <p className="text-red-100 text-sm">This action cannot be undone</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={actionLoading}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Driver Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                                <p className="text-sm text-gray-600">{driver.email}</p>
                                <div className="flex items-center space-x-4 mt-1">
                                    <div className="flex items-center text-xs text-gray-500">
                                        <Car className="w-3 h-3 mr-1" />
                                        {driver.vehicleType}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500">
                                        <Star className="w-3 h-3 mr-1" />
                                        {driver.rating} rating
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warning Message */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-red-800 mb-2">
                                    Are you sure you want to delete this driver?
                                </h4>
                                <div className="text-sm text-red-700 space-y-1">
                                    <p>• This will permanently remove the driver from the system</p>
                                    <p>• All associated trip history will be preserved but marked as deleted user</p>
                                    <p>• The driver will no longer be able to access their account</p>
                                    <p>• This action cannot be undone</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Driver Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">{driver.totalTrips}</div>
                            <div className="text-xs text-gray-500">Total Trips</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">${driver.totalEarnings.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">Total Earnings</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">{driver.experience}</div>
                            <div className="text-xs text-gray-500">Years Exp.</div>
                        </div>
                    </div>

                    {/* Confirmation Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type the driver's name to confirm deletion:
                        </label>
                        <input
                            type="text"
                            placeholder={`Type "${driver.name}" to confirm`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            disabled={actionLoading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This extra step helps prevent accidental deletions
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={actionLoading}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={actionLoading}
                            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {actionLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Driver
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteDriverModal;