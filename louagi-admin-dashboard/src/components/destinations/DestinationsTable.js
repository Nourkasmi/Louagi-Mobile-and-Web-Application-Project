import React from 'react';
import {
    MapPin,
    Edit,
    Trash2,
    Route,
    Clock,
    DollarSign,
    Zap,
    ToggleLeft,
    Plus
} from 'lucide-react';

const DestinationsTable = ({
    destinations,
    onEdit,
    onDelete,
    onCreateNew
}) => {
    if (destinations.length === 0) {
        return (
            <div className="card">
                <div className="p-8 text-center">
                    <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No destinations found</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Create your first destination to start managing routes
                    </p>
                    <button
                        onClick={onCreateNew}
                        className="btn-primary mt-4 flex items-center space-x-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Add First Destination</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    Destinations ({destinations.length})
                </h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Route
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Distance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Duration
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {destinations.map((destination) => (
                            <tr key={destination.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <MapPin className="h-5 w-5 text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {destination.startStation?.name} → {destination.endStation?.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {destination.startStation?.city} to {destination.endStation?.city}
                                            </div>
                                            {destination.description && (
                                                <div className="text-xs text-gray-400 mt-1">
                                                    {destination.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-900">
                                        <Route className="h-4 w-4 text-gray-400 mr-1" />
                                        {destination.distance} km
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-900">
                                        <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                                        ${destination.basePrice}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center text-sm text-gray-900">
                                        <Clock className="h-4 w-4 text-gray-400 mr-1" />
                                        {destination.estimatedDuration} min
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${destination.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                        }`}>
                                        {destination.isActive ? (
                                            <>
                                                <Zap className="h-3 w-3 mr-1" />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft className="h-3 w-3 mr-1" />
                                                Inactive
                                            </>
                                        )}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => onEdit(destination)}
                                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                                            title="Edit"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(destination)}
                                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DestinationsTable;