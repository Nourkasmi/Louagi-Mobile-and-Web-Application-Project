import React from 'react';
import {
    X,
    Calendar,
    Clock,
    MapPin,
    Users,
    FileText,
    CheckCircle,
    XCircle,
    Activity
} from 'lucide-react';

const ScheduleDetailsModal = ({ schedule, daysOfWeek, onClose }) => {
    if (!schedule) return null;

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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const calculateDuration = () => {
        if (!schedule.startTime || !schedule.endTime) return 'N/A';
        try {
            const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
            const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);

            const startTotalMinutes = startHours * 60 + startMinutes;
            const endTotalMinutes = endHours * 60 + endMinutes;

            const durationMinutes = endTotalMinutes - startTotalMinutes;
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;

            if (hours > 0) {
                return `${hours}h ${minutes}m`;
            } else {
                return `${minutes}m`;
            }
        } catch {
            return 'N/A';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4" style={{ overflow: 'auto' }}>
            <div className="min-h-screen flex items-center justify-center py-8">
                <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full flex flex-col">
                    {/* Modal Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Schedule Details</h2>
                                    <p className="text-blue-100 text-sm">
                                        {schedule.station?.name} - {getDayName(schedule.dayOfWeek)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Modal Body (scrollable if needed) */}
                    <div className="p-6" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        {/* Status Banner */}
                        <div className={`mb-6 p-4 rounded-lg border ${schedule.isActive
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-center">
                                {schedule.isActive ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                )}
                                <span className={`font-medium ${schedule.isActive ? 'text-green-800' : 'text-red-800'
                                    }`}>
                                    Schedule is {schedule.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>

                        {/* Information Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            {/* Station Info */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                                    Station Information
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Name:</span>
                                        <p className="text-gray-900">{schedule.station?.name || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Location:</span>
                                        <p className="text-gray-900">
                                            {schedule.station?.city}, {schedule.station?.state}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Capacity:</span>
                                        <p className="text-gray-900">{schedule.station?.capacity || 'N/A'} vehicles</p>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Timing */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Clock className="w-5 h-5 mr-2 text-green-600" />
                                    Timing Details
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Day:</span>
                                        <p className="text-gray-900">{getDayName(schedule.dayOfWeek)}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Start Time:</span>
                                        <p className="text-gray-900">{formatTime(schedule.startTime)}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">End Time:</span>
                                        <p className="text-gray-900">{formatTime(schedule.endTime)}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Duration:</span>
                                        <p className="text-gray-900">{calculateDuration()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Operational Details */}
                            <div className="bg-gray-50 rounded-lg p-5">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <Users className="w-5 h-5 mr-2 text-purple-600" />
                                    Operations
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Max Trips:</span>
                                        <p className="text-gray-900">{schedule.maxTrips || 10} per day</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Status:</span>
                                        <p className={`font-medium ${schedule.isActive ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {schedule.isActive ? 'Active' : 'Inactive'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Schedule ID:</span>
                                        <p className="text-gray-900 font-mono text-xs">
                                            {schedule.id?.slice(0, 8)}...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        {schedule.notes && (
                            <div className="bg-blue-50 rounded-lg p-5 mb-6">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                                    Notes
                                </h3>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                    {schedule.notes}
                                </p>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="bg-gray-50 rounded-lg p-5 mb-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Activity className="w-5 h-5 mr-2 text-gray-600" />
                                Schedule Metadata
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">Created:</span>
                                    <p className="text-gray-900">{formatDate(schedule.createdAt)}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Last Updated:</span>
                                    <p className="text-gray-900">{formatDate(schedule.updatedAt)}</p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Station ID:</span>
                                    <p className="text-gray-900 font-mono text-xs">
                                        {schedule.stationId?.slice(0, 8)}...
                                    </p>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Day Code:</span>
                                    <p className="text-gray-900">{schedule.dayOfWeek} ({getDayName(schedule.dayOfWeek)})</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer - Only Close button, no Edit */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-2xl flex items-center justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleDetailsModal;