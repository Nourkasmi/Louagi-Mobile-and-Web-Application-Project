// src/components/drivers/DriversTable.js
import React from 'react';
import {
    Car,
    Star,
    Shield,
    Clock,
    Phone,
    Mail,
    Eye,
    Edit,
    Trash2,
    XCircle
} from 'lucide-react';

const DriversTable = ({ drivers, pagination, onPageChange }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'waiting': return 'bg-yellow-100 text-yellow-800';
            case 'on_trip': return 'bg-green-100 text-green-800';
            case 'offline': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'waiting': return <Clock className="w-3 h-3" />;
            case 'on_trip': return <Car className="w-3 h-3" />;
            case 'offline': return <XCircle className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow border">
            <div className="p-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Driver</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Vehicle</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {drivers.map((driver) => (
                                <tr key={driver.id} className="border-b hover:bg-gray-50">
                                    {/* Driver Info */}
                                    <td className="py-4 px-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                <Car className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 flex items-center">
                                                    {driver.name}
                                                    {driver.isVerified && (
                                                        <Shield className="w-4 h-4 text-green-500 ml-2" />
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    License: {driver.licenseNo}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Joined: {new Date(driver.joinedDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            <div className="flex items-center text-gray-900 mb-1">
                                                <Mail className="w-3 h-3 mr-1" />
                                                {driver.email}
                                            </div>
                                            <div className="flex items-center text-gray-500">
                                                <Phone className="w-3 h-3 mr-1" />
                                                {driver.phone}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Vehicle */}
                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900">{driver.vehicleType}</div>
                                            <div className="text-gray-500">{driver.vehicleCapacity} seats</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Exp: {driver.experience} years
                                            </div>
                                        </div>
                                    </td>

                                    {/* Performance */}
                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            <div className="flex items-center mb-1">
                                                <Star className="w-3 h-3 text-yellow-500 mr-1" />
                                                <span className="font-medium">{driver.rating}</span>
                                            </div>
                                            <div className="text-gray-500">{driver.totalTrips} trips</div>
                                            <div className="text-green-600 font-medium">
                                                ${driver.totalEarnings.toFixed(2)}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="py-4 px-4">
                                        <div className="space-y-2">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.currentStatus)}`}>
                                                {getStatusIcon(driver.currentStatus)}
                                                <span className="ml-1">{driver.currentStatus.replace('_', ' ').toUpperCase()}</span>
                                            </span>
                                            {driver.queuePosition && (
                                                <div className="text-xs text-gray-500">
                                                    Queue: #{driver.queuePosition}
                                                </div>
                                            )}
                                            <div className={`text-xs ${driver.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                {driver.isActive ? 'Active' : 'Inactive'}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-4 px-4">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="text-gray-600 hover:text-gray-800 p-1"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="text-red-600 hover:text-red-800 p-1"
                                                title="Suspend"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-700">
                        Showing {drivers.length} of {pagination.total} drivers
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onPageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                            {pagination.currentPage}
                        </span>
                        <button
                            onClick={() => onPageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage >= pagination.totalPages}
                            className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriversTable;