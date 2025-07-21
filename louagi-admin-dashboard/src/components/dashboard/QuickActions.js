import React from 'react';
import { Users, Car, MapPin, BarChart3 } from 'lucide-react';

const QuickAction = ({ icon: Icon, title, subtitle, color, onClick }) => (
    <button
        onClick={onClick}
        className="group relative p-6 bg-white rounded-2xl border border-gray-100 hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left w-full"
    >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
        <div className="relative">
            <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} bg-opacity-10 mb-4`}>
                <Icon className={`w-6 h-6 bg-gradient-to-r ${color} bg-clip-text text-transparent`} />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
    </button>
);

const QuickActions = ({ stats, onNavigate }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
            <QuickAction
                icon={Users}
                title="Manage Users"
                subtitle={`${stats.totalUsers} total users`}
                color="from-blue-600 to-blue-800"
                onClick={() => onNavigate('users')}
            />
            <QuickAction
                icon={Car}
                title="View Trips"
                subtitle={`${stats.activeTrips} active now`}
                color="from-green-600 to-green-800"
                onClick={() => onNavigate('trips')}
            />
            <QuickAction
                icon={MapPin}
                title="Queue Status"
                subtitle="Check driver queues"
                color="from-purple-600 to-purple-800"
                onClick={() => onNavigate('queue')}
            />
            <QuickAction
                icon={BarChart3}
                title="Analytics"
                subtitle="View detailed reports"
                color="from-orange-600 to-orange-800"
                onClick={() => onNavigate('analytics')}
            />
        </div>
    </div>
);

export default QuickActions;