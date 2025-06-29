// src/components/users/UserCard.js
import React from 'react';
import { Eye, Lock, Unlock, Trash2, Phone, Calendar, UserCheck, UserX } from 'lucide-react';
import { getRoleIcon, getRoleColor } from '../../utils/helpers';

const UserCard = ({ user, actionLoading, onViewUser, onDeleteUser, onToggleStatus }) => (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
        <div className="p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                            {user.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{user.username}</h3>
                        <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1 capitalize">{user.role}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onViewUser(user)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => onToggleStatus(user.id, user.isActive)}
                        disabled={actionLoading[user.id]}
                        className={`p-2 rounded-lg transition-colors ${user.isActive
                            ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                            }`}
                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                    >
                        {actionLoading[user.id] ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        ) : (
                            user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />
                        )}
                    </button>

                    {user.role !== 'admin' && (
                        <button
                            onClick={() => onDeleteUser(user)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete User"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{user.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                    {user.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-400">
                    ID: {user.id?.toString().slice(0, 8)}...
                </span>
            </div>
        </div>
    </div>
);

export default UserCard;