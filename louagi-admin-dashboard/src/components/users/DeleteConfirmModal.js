import React from 'react';
import { AlertCircle } from 'lucide-react';

const DeleteConfirmModal = ({ user, onClose, onConfirm, actionLoading }) => {
    const handleConfirm = async () => {
        try {
            // ✅ FIX: Wait for the deletion to complete before closing modal
            const result = await onConfirm(user.id, user.username);

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
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Are you sure you want to delete <strong>{user.username}</strong>? This action cannot be undone.
                    </p>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            disabled={actionLoading[user.id]}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={actionLoading[user.id]}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {actionLoading[user.id] ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;