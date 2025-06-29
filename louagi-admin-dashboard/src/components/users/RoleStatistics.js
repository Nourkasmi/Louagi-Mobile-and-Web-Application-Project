import React from 'react';
import { getRoleIcon, getRoleColor } from '../../utils/helpers';

const RoleStatistics = ({ users }) => {
    const roles = ['admin', 'driver', 'passenger'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map(role => {
                const roleUsers = users.filter(user => user.role === role);
                const activeCount = roleUsers.filter(user => user.isActive).length;

                return (
                    <div key={role} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${getRoleColor(role)}`}>
                                {getRoleIcon(role)}
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-gray-900">{roleUsers.length}</p>
                                <p className="text-sm text-gray-600 capitalize">{role}s</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="text-green-600 font-medium">{activeCount} active</span>
                            {roleUsers.length > activeCount && (
                                <span className="text-gray-500"> • {roleUsers.length - activeCount} inactive</span>
                            )}
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${roleUsers.length > 0 ? (activeCount / roleUsers.length) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default RoleStatistics;