// src/components/dashboard/RecentActivity.js
import React from 'react';
import { Activity, FileText, Car, Users, DollarSign } from 'lucide-react';

const ActivityItem = ({ activity }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'booking': return <FileText className="w-4 h-4" />;
            case 'trip': return <Car className="w-4 h-4" />;
            case 'driver': return <Users className="w-4 h-4" />;
            case 'payment': return <DollarSign className="w-4 h-4" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getColor = (status) => {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-100';
            case 'in_progress': return 'text-blue-600 bg-blue-100';
            case 'confirmed': return 'text-purple-600 bg-purple-100';
            case 'scheduled': return 'text-orange-600 bg-orange-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const formatTime = (timeString) => {
        try {
            const date = new Date(timeString);
            const now = new Date();
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));

            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
            if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
            return date.toLocaleDateString();
        } catch {
            return 'Recently';
        }
    };

    return (
        <div className="flex items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 transition-colors duration-200 hover:shadow-md">
            <div className={`p-2 rounded-lg ${getColor(activity.status)}`}>
                {getIcon(activity.type)}
            </div>
            <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">{formatTime(activity.time)}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getColor(activity.status)}`}>
                {activity.status}
            </div>
        </div>
    );
};

const RecentActivity = ({ recentActivity }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Activity className="w-5 h-5 text-blue-600" />
        </div>
        <div className="space-y-3">
            {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
                recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                ))
            )}
        </div>
    </div>
);

export default RecentActivity;