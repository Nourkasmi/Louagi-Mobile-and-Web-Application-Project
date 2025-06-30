// src/components/stations/StationTable.js
import React from 'react';
import {
    MapPin,
    Building,
    Phone,
    Mail,
    Car,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Wifi,
    Coffee,
    Shield
} from 'lucide-react';

const StationTable = ({ stations, pagination, setFilters, onEdit, onDelete, onView }) => {
    const getStatusColor = (isActive) => {
        return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    const getStatusIcon = (isActive) => {
        return isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />;
    };

    const renderAmenities = (amenities) => {
        if (!amenities || Object.keys(amenities).length === 0) {
            return <span className="text-gray-400 text-xs">No amenities</span>;
        }

        const amenityIcons = {
            wifi: <Wifi className="w-3 h-3" />,
            foodCourt: <Coffee className="w-3 h-3" />,
            security: <Shield className="w-3 h-3" />,
            toilets: <Building className="w-3 h-3" />
        };

        return (
            <div className="flex space-x-1">
                {Object.entries(amenities).map(([key, value]) =>
                    value && amenityIcons[key] ? (
                        <div key={key} className="text-blue-500" title={key}>
                            {amenityIcons[key]}
                        </div>
                    ) : null
                )}
            </div>
        );
    };

    if (stations.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow border p-6">
                <div className="text-center py-8 text-gray-500">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No stations found</h3>
                    <p className="text-gray-600">
                        No stations have been created yet or match your current filters.
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
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Station</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Location</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Capacity</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Activity</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stations.map((station) => (
                                <tr key={station.id} className="border-b hover:bg-gray-50">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                                <MapPin className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{station.name}</div>
                                                <div className="text-sm text-gray-500">
                                                    ID: {station.id.slice(0, 8)}...
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {renderAmenities(station.amenities)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900">{station.address}</div>
                                            <div className="text-gray-500">{station.city}, {station.state}</div>
                                            <div className="text-gray-400">{station.zipCode}</div>
                                        </div>
                                    </td>

                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            {station.contactPhone && (
                                                <div className="flex items-center text-gray-900 mb-1">
                                                    <Phone className="w-3 h-3 mr-1" />
                                                    {station.contactPhone}
                                                </div>
                                            )}
                                            {station.contactEmail && (
                                                <div className="flex items-center text-gray-500">
                                                    <Mail className="w-3 h-3 mr-1" />
                                                    {station.contactEmail}
                                                </div>
                                            )}
                                            {!station.contactPhone && !station.contactEmail && (
                                                <span className="text-gray-400 text-xs">No contact info</span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900">{station.capacity} slots</div>
                                            <div className="text-gray-500">
                                                {station.currentQueues} in queue
                                            </div>
                                            <div className={`text-xs ${station.utilizationRate > 80 ? 'text-red-600' :
                                                station.utilizationRate > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                {station.utilizationRate}% utilized
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4 px-4">
                                        <div className="text-sm">
                                            <div className="flex items-center mb-1">
                                                <Car className="w-3 h-3 text-blue-500 mr-1" />
                                                <span className="font-medium">{station.activeTrips}</span>
                                                <span className="text-gray-500 ml-1">active</span>
                                            </div>
                                            <div className="text-gray-400 text-xs">
                                                Updated: {new Date(station.lastActivity).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="py-4 px-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(station.isActive)}`}>
                                            {getStatusIcon(station.isActive)}
                                            <span className="ml-1">{station.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                        </span>
                                    </td>

                                    <td className="py-4 px-4">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => onView && onView(station)}
                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEdit && onEdit(station)}
                                                className="text-gray-600 hover:text-gray-800 p-1"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete && onDelete(station)}
                                                className="text-red-600 hover:text-red-800 p-1"
                                                title="Deactivate"
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
                {pagination.totalPages > 1 && (
                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-gray-700">
                            Showing {stations.length} of {pagination.total} stations
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                disabled={pagination.currentPage === 1}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
                                {pagination.currentPage}
                            </span>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                                disabled={pagination.currentPage >= pagination.totalPages}
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

export default StationTable;