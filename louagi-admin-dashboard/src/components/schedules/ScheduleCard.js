import React from 'react';
import {
    Calendar,
    Clock,
    MapPin,
    Trash2,
    Eye,
    Check,
    X,
    Users
} from 'lucide-react';

const ScheduleCard = ({ schedule, daysOfWeek, onDelete, onViewDetails }) => {
    const getDayName = (dayNumber) => {
        return daysOfWeek.find(day => day.value === dayNumber)?.label || 'Unknown';
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}:${minutes} ${ampm}`;
        } catch {
            return timeString;
        }
    };

    const getStatusColor = (isActive) => {
        return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    };

    // Simple delete handler - just call the onDelete function passed from parent
    const handleDeleteClick = () => {
        const stationName = schedule.station?.name || 'Unknown Station';
        const dayName = getDayName(schedule.dayOfWeek);
        const timeRange = `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`;

        const confirmMessage = `Are you sure you want to delete this schedule?\n\nStation: ${stationName}\nDay: ${dayName}\nTime: ${timeRange}\n\nThis action cannot be undone.`;

        if (window.confirm(confirmMessage)) {
            console.log('🗑️ Delete confirmed, calling onDelete with:', schedule.id, stationName);
            onDelete(schedule.id, stationName);
        } else {
            console.log('❌ Delete cancelled by user');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {schedule.station?.name || 'Unknown Station'} - {schedule.station?.city}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(schedule.isActive)}`}>
                            {schedule.isActive ? (
                                <>
                                    <Check className="w-3 h-3 mr-1" />
                                    Active
                                </>
                            ) : (
                                <>
                                    <X className="w-3 h-3 mr-1" />
                                    Inactive
                                </>
                            )}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <div>
                                <span className="font-medium">Day:</span><br />
                                {getDayName(schedule.dayOfWeek)}
                            </div>
                        </div>

                        <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <div>
                                <span className="font-medium">Hours:</span><br />
                                {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </div>
                        </div>

                        <div className="flex items-center text-gray-600">
                            <Users className="w-4 h-4 mr-2" />
                            <div>
                                <span className="font-medium">Max Trips:</span><br />
                                {schedule.maxTrips || 10} per day
                            </div>
                        </div>

                        <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            <div>
                                <span className="font-medium">Station:</span><br />
                                {schedule.station?.city} - {schedule.station?.state}
                            </div>
                        </div>
                    </div>

                    {schedule.notes && (
                        <div className="mt-3 text-sm text-gray-500">
                            <span className="font-medium">Notes:</span> {schedule.notes}
                        </div>
                    )}

                    <div className="mt-3 text-xs text-gray-400">
                        ID: {schedule.id?.slice(0, 8)}... •
                        Created: {new Date(schedule.createdAt).toLocaleDateString()}
                        {schedule.updatedAt !== schedule.createdAt && (
                            <> • Updated: {new Date(schedule.updatedAt).toLocaleDateString()}</>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                    <button
                        onClick={() => onViewDetails(schedule)}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        title="View Details"
                    >
                        <Eye className="w-3 h-3 mr-1" />
                        Details
                    </button>

                    <button
                        onClick={handleDeleteClick}
                        className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        title="Delete Schedule"
                    >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleCard;