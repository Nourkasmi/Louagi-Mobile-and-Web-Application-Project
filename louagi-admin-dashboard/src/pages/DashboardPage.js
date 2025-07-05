// src/pages/DashboardPage.js
import React from 'react';
import { Users, Car, CreditCard, FileText } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    StatCard,
    SystemStatus,
    RecentActivity,
    DashboardHeader,
    DashboardError
} from '../components/dashboard';
import { useDashboardData } from '../hooks/useDashboardData';

const DashboardPage = () => {
    const {
        stats,
        loading,
        error,
        recentActivity,
        fetchDashboardStats
    } = useDashboardData();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <LoadingSpinner text="Loading dashboard..." />
            </div>
        );
    }

    if (error) {
        return <DashboardError error={error} onRetry={fetchDashboardStats} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="p-6 space-y-6">
                {/* Header */}
                <DashboardHeader onRefresh={fetchDashboardStats} />

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers.toLocaleString()}
                        changeType="positive"
                        icon={Users}
                        color="from-blue-600 to-blue-800"
                        subtitle="Active this month"
                    />
                    <StatCard
                        title="Active Trips"
                        value={stats.activeTrips}
                        changeType="positive"
                        icon={Car}
                        color="from-green-600 to-green-800"
                        subtitle="Currently running"
                    />
<StatCard
    title="Total Revenue"
    value={`$${stats.totalRevenue.toFixed(2)}`}
    icon={CreditCard}
    color="from-purple-600 to-purple-800"
    subtitle="This month"
/>
                    <StatCard
                        title="Today's Bookings"
                        value={stats.todayBookings}
                        changeType="positive"
                        icon={FileText}
                        color="from-orange-600 to-orange-800"
                        subtitle="Since midnight"
                    />
                </div>

                {/* System Status Only */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    <SystemStatus />
                </div>

                {/* Recent Activity Only */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                    <RecentActivity recentActivity={recentActivity} />
                </div>

                {/* Footer Info */}
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'} •
                        Last updated: {new Date().toLocaleTimeString()} •
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            All systems operational
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
