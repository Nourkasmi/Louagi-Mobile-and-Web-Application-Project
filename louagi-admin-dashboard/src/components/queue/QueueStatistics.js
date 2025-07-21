import React from 'react';
import { Users, Clock, Car, CheckCircle } from 'lucide-react';

const QueueStatistics = ({ queues }) => {
    if (!queues || queues.length === 0) {
        return null;
    }

    const stats = {
        totalDrivers: queues.length,
        waitingDrivers: queues.filter(q => q.status === 'waiting').length,
        calledDrivers: queues.filter(q => q.status === 'called').length,
        assignedDrivers: queues.filter(q => q.status === 'assigned').length,
        doneDrivers: queues.filter(q => q.status === 'done').length,
        skippedDrivers: queues.filter(q => q.status === 'skipped').length
    };

    const calculateAverageWaitTime = () => {
        const waitingDrivers = queues.filter(q => q.status === 'waiting');
        if (waitingDrivers.length === 0) return 0;

        const totalWaitTime = waitingDrivers.reduce((sum, driver) => {
            const waitTime = Math.round((new Date() - new Date(driver.joinedAt || driver.createdAt)) / (1000 * 60));
            return sum + waitTime;
        }, 0);

        return Math.round(totalWaitTime / waitingDrivers.length);
    };

    const averageWaitTime = calculateAverageWaitTime();

    const statCards = [
        {
            title: 'Total Drivers',
            value: stats.totalDrivers,
            icon: Users,
            color: 'blue',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600'
        },
        {
            title: 'Waiting',
            value: stats.waitingDrivers,
            icon: Clock,
            color: 'yellow',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-600'
        },
        {
            title: 'Assigned',
            value: stats.assignedDrivers,
            icon: Car,
            color: 'green',
            bgColor: 'bg-green-100',
            textColor: 'text-green-600'
        },
        {
            title: 'Average Wait',
            value: `${averageWaitTime}m`,
            icon: CheckCircle,
            color: 'purple',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div key={index} className="bg-white rounded-lg shadow border p-6">
                        <div className="flex items-center">
                            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                                <Icon className={`h-6 w-6 ${stat.textColor}`} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default QueueStatistics;
