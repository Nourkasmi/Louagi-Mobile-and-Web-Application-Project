// src/components/users/UserModal.js
import React from 'react';
import { X, Mail, Phone } from 'lucide-react';
import { getRoleIcon, getRoleColor } from '../../utils/helpers';

const UserModal = ({ user, onClose, onToggleStatus }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">User Details</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-6">
                <div className="flex items-center space-x-6 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                        {user.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">{user.username}</h3>
                        <p className="text-gray-600">{user.email}</p>
                        <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border mt-2 ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-2 capitalize">{user.role}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-3">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">{user.email}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm">{user.phone || 'Not provided'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Account Status</h4>
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-sm font-medium">{user.isActive ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Account Details</h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-gray-500">User ID</span>
                                    <p className="text-sm font-medium font-mono">{user.id}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500">Created</span>
                                    <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleString()}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-500">Last Updated</span>
                                    <p className="text-sm font-medium">{new Date(user.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={() => onToggleStatus(user.id, user.isActive)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${user.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                    >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default UserModal;