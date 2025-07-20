// src/components/stations/DeleteStationModal.js - Enhanced Delete Confirmation Modal
import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Building, MapPin, Users } from 'lucide-react';

const DeleteStationModal = ({ station, showModal, onClose, onConfirm, deleting = false }) => {
    const [confirmText, setConfirmText] = useState('');
    const [understood, setUnderstood] = useState(false);

    if (!showModal || !station) return null;

    const handleConfirm = async () => {
        if (confirmText.toLowerCase() !== 'delete' || !understood) {
            return;
        }

        await onConfirm(station);

        // Reset state
        setConfirmText('');
        setUnderstood(false);
    };

    const isConfirmReady = confirmText.toLowerCase() === 'delete' && understood;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="bg-red-50 px-6 py-4 rounded-t-xl border-b border-red-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-red-800">Delete Station</h2>
                                <p className="text-red-600 text-sm">This action cannot be undone</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={deleting}
                            className="p-1 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-red-600" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {/* Station Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Building className="w-4 h-4 mr-2" />
                            Station to be deleted:
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-700">
                                <span className="font-medium w-20">Name:</span>
                                <span>{station.name}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="font-medium w-16">Location:</span>
                                <span>{station.city}, {station.state}</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <Users className="w-3 h-3 mr-1" />
                                <span className="font-medium w-16">Capacity:</span>
                                <span>{station.capacity} slots</span>
                            </div>
                            <div className="flex items-center text-gray-700">
                                <span className="font-medium w-20">Status:</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${station.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {station.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-medium text-yellow-800 mb-1">Warning</h4>
                                <p className="text-yellow-700 text-sm">
                                    Deleting this station will:
                                </p>
                                <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                                    <li>• Remove all station data permanently</li>
                                    <li>• Affect any associated schedules and queues</li>
                                    <li>• Impact trips that use this station</li>
                                    <li>• Cannot be reversed</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Confirmation Checks */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type "DELETE" to confirm:
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${confirmText.toLowerCase() === 'delete'
                                        ? 'border-green-300 bg-green-50'
                                        : 'border-gray-300'
                                    }`}
                                placeholder="Type DELETE here"
                                disabled={deleting}
                            />
                        </div>

                        <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={understood}
                                onChange={(e) => setUnderstood(e.target.checked)}
                                className="mt-0.5 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                disabled={deleting}
                            />
                            <span className="text-sm text-gray-700">
                                I understand this action is permanent and cannot be undone
                            </span>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            This action is irreversible
                        </p>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={onClose}
                                disabled={deleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!isConfirmReady || deleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                                {deleting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Station
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteStationModal;