// src/components/trips/TripStatistics.js
import React from 'react';
import { Car, Clock, CheckCircle, Users } from 'lucide-react';

const TripStatistics = ({ stats }) => {
    const statCards = [
        {
            title: 'Total Trips',
            value: stats.totalTrips,
            icon: Car,
            color: 'blue',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600',
            subtitle: 'All time'
        },
        {
            title: 'Active Trips',
            value: stats.activeTrips,
            icon: Clock,
            color: 'green',
            bgColor: 'bg-green-100',
            textColor: 'text-green-600',
            subtitle: 'Currently running'
        },
        {
            title: 'Completed',
            value: stats.completedTrips,
            icon: CheckCircle,
            color: 'purple',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-600',
            subtitle: `${stats.totalTrips > 0 ? Math.round((stats.completedTrips / stats.totalTrips) * 100) : 0}% completion rate`
        },
        {
            title: 'Total Passengers',
            value: stats.totalPassengers,
            icon: Users,
            color: 'yellow',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-600',
            subtitle: 'Served today'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div key={index} className="bg-white rounded-lg shadow border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                            </div>
                            <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                <Icon className={`h-6 w-6 ${stat.textColor}`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TripStatistics;