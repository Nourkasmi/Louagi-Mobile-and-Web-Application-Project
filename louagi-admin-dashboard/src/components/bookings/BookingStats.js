import React from 'react';
import { FileText, CheckCircle, Clock, DollarSign } from 'lucide-react';

const BookingStats = ({ stats }) => {
    const statCards = [
        {
            title: 'Total Bookings',
            value: stats.totalBookings,
            icon: FileText,
            color: 'blue',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-600',
            subtitle: 'All time'
        },
        {
            title: 'Confirmed',
            value: stats.confirmedBookings,
            icon: CheckCircle,
            color: 'green',
            bgColor: 'bg-green-100',
            textColor: 'text-green-600',
            subtitle: `${stats.totalBookings > 0 ? Math.round((stats.confirmedBookings / stats.totalBookings) * 100) : 0}% of total`
        },
        {
            title: 'Pending',
            value: stats.pendingBookings,
            icon: Clock,
            color: 'yellow',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-600',
            subtitle: 'Awaiting confirmation'
        },
        {
            title: 'Total Revenue',
            value: `$${stats.totalRevenue.toFixed(2)}`,
            icon: DollarSign,
            color: 'purple',
            bgColor: 'bg-purple-100',
            textColor: 'text-purple-600',
            subtitle: `Avg: $${stats.averageBookingValue.toFixed(2)}`
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

export default BookingStats;