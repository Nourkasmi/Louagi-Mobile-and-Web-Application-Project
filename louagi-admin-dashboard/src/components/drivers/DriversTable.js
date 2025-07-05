// src/components/drivers/DriversTable.js - Safe version with null checks
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
    XCircle,
    ToggleLeft,
    ToggleRight,
    CheckCircle
} from 'lucide-react';

const DriversTable = ({ 
    drivers = [], 
    pagination = {}, 
    onPageChange = () => {},
    onViewDriver = () => {},
    onEditDriver = () => {},
    onDeleteDriver = () => {},
    onToggleStatus = () => {},
    actionLoading = {} 
}) => {
    // Safe data access functions
    const safeValue = (value, fallback = 'N/A') => {
        return value !== null && value !== undefined && value !== '' ? value : fallback;
    };

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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return 'N/A';
        }
    };

    // Handle case where drivers array is empty or undefined
    if (!Array.isArray(drivers) || drivers.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow border p-8">
                <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Car className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
                    <p className="text-gray-600">
                        {Array.isArray(drivers) ? 
                            'No drivers have been registered yet or match your current filters.' :
                            'Loading driver data...'
                        }
                    </p>
                </div>
            </div>
        );
    }

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
                            {drivers.map((driver, index) => {
                                // Ensure driver object exists and has an ID
                                if (!driver || (!driver.id && !driver._id)) {
                                    console.warn('Invalid driver object at index', index, driver);
                                    return null;
                                }

                                const driverId = driver.id || driver._id;
                                
                                return (
                                    <tr key={driverId} className="border-b hover:bg-gray-50">
                                        {/* Driver Info */}
                                        <td className="py-4 px-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                    <Car className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 flex items-center">
                                                        {safeValue(driver.name || driver.username)}
                                                        {driver.isVerified && (
                                                            <Shield className="w-4 h-4 text-green-500 ml-2" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        License: {safeValue(driver.licenseNo || driver.license_no)}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        Joined: {formatDate(driver.joinedDate || driver.createdAt)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td className="py-4 px-4">
                                            <div className="text-sm">
                                                <div className="flex items-center text-gray-900 mb-1">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    {safeValue(driver.email)}
                                                </div>
                                                <div className="flex items-center text-gray-500">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {safeValue(driver.phone)}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Vehicle */}
                                        <td className="py-4 px-4">
                                            <div className="text-sm">
                                                <div className="font-medium text-gray-900">
                                                    {safeValue(driver.vehicleType || driver.vehicle_type)}
                                                </div>
                                                <div className="text-gray-500">
                                                    {safeValue(driver.vehicleCapacity || driver.vehicle_capacity, 4)} seats
                                                </div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    Exp: {safeValue(driver.experience, 0)} years
                                                </div>
                                            </div>
                                        </td>

                                        {/* Performance */}
                                        <td className="py-4 px-4">
                                            <div className="text-sm">
                                                <div className="flex items-center mb-1">
                                                    <Star className="w-3 h-3 text-yellow-500 mr-1" />
                                                    <span className="font-medium">{safeValue(driver.rating, '0.0')}</span>
                                                </div>
                                                <div className="text-gray-500">{safeValue(driver.totalTrips, 0)} trips</div>
                                                <div className="text-green-600 font-medium">
                                                    ${safeValue(driver.totalEarnings, 0).toFixed ? safeValue(driver.totalEarnings, 0).toFixed(2) : '0.00'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="py-4 px-4">
                                            <div className="space-y-2">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.currentStatus || 'offline')}`}>
                                                    {getStatusIcon(driver.currentStatus || 'offline')}
                                                    <span className="ml-1">
                                                        {safeValue(driver.currentStatus, 'offline').replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </span>
                                                {driver.queuePosition && (
                                                    <div className="text-xs text-gray-500">
                                                        Queue: #{driver.queuePosition}
                                                    </div>
                                                )}
                                                <div className={`text-xs flex items-center ${driver.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                                    {driver.isActive ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                                    {driver.isActive ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-4 px-4">
                                            <div className="flex items-center space-x-2">
                                                {/* View Button */}
                                                <button
                                                    onClick={() => onViewDriver(driver)}
                                                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => onEditDriver(driver)}
                                                    className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                                                    title="Edit Driver"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>

                                                {/* Toggle Status Button */}
                                                <button
                                                    onClick={() => onToggleStatus(driverId, driver.isActive)}
                                                    disabled={actionLoading[driverId]}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        driver.isActive 
                                                            ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50' 
                                                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                                                    }`}
                                                    title={driver.isActive ? 'Deactivate Driver' : 'Activate Driver'}
                                                >
                                                    {actionLoading[driverId] ? (
                                                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                                    ) : (
                                                        driver.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />
                                                    )}
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => onDeleteDriver(driver)}
                                                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Delete Driver"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }).filter(Boolean)} {/* Filter out null entries */}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-700">
                            Showing {drivers.length} of {pagination.total || 0} drivers
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => onPageChange((pagination.currentPage || 1) - 1)}
                                disabled={(pagination.currentPage || 1) === 1}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                                {pagination.currentPage || 1}
                            </span>
                            <button
                                onClick={() => onPageChange((pagination.currentPage || 1) + 1)}
                                disabled={(pagination.currentPage || 1) >= (pagination.totalPages || 1)}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriversTable;