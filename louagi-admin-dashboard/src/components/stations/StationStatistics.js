// src/components/stations/StationStatistics.js
import React from 'react';
import { Building, CheckCircle, Users, Activity } from 'lucide-react';

const StationStatistics = ({ stats }) => {
    const statCards = [
        {
            title: 'Total Stations',
            value: stats.totalStations,
            icon: Building,
            color: 'blue',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            subtitle: 'Across all cities'
        },
        {
            title: 'Active Stations',
            value: stats.activeStations,
            icon: CheckCircle,
            color: 'green',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600',
            subtitle: `${stats.totalStations > 0 ? Math.round((stats.activeStations / stats.totalStations) * 100) : 0}% operational`
        },
        {
            title: 'Total Capacity',
            value: stats.totalCapacity,
            icon: Users,
            color: 'purple',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            subtitle: 'Driver slots'
        },
        {
            title: 'Avg Capacity',
            value: stats.averageCapacity,
            icon: Activity,
            color: 'orange',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-600',
            subtitle: 'Per station'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div key={index} className="bg-white rounded-lg shadow border p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                                <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
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

export default StationStatistics;