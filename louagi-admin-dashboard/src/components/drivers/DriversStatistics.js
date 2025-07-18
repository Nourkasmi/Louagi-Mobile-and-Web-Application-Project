// src/components/drivers/DriversStatistics.js
import React from 'react';
import { Users, CheckCircle, Clock } from 'lucide-react';

const DriversStatistics = ({ stats }) => {
    const statCards = [
        {
            title: 'Total Drivers',
            value: stats.totalDrivers,
            description: 'All registered drivers',
            icon: Users,
            color: 'blue',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            title: 'Active Drivers',
            value: stats.activeDrivers,
            description: `${stats.totalDrivers > 0 ? Math.round((stats.activeDrivers / stats.totalDrivers) * 100) : 0}% online rate`,
            icon: CheckCircle,
            color: 'green',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
        },
        {
            title: 'In Queue',
            value: stats.waitingInQueue,
            description: 'Currently waiting',
            icon: Clock,
            color: 'yellow',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-600'
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
                                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
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

export default DriversStatistics;
