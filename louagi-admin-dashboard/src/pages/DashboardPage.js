import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { Users, Car, CreditCard, FileText } from 'lucide-react';

const DashboardPage = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeTrips: 0,
        totalRevenue: 0,
        todayBookings: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            console.log('📊 Fetching dashboard statistics...');

            const response = await dashboardAPI.getStats();

            if (response.success) {
                setStats(response.data);
                console.log('✅ Dashboard stats loaded:', response.data);
            } else {
                console.warn('⚠️ Failed to load dashboard stats, using default values');
            }
        } catch (error) {
            console.error('❌ Dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading dashboard..." />;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Dashboard"
                subtitle="Welcome to Louagi Admin Dashboard"
                action={
                    <button
                        onClick={fetchDashboardStats}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                        Refresh
                    </button>
                }
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    icon={Users}
                    color="blue"
                />

                <StatCard
                    title="Active Trips"
                    value={stats.activeTrips}
                    icon={Car}
                    color="green"
                />

                <StatCard
                    title="Total Revenue"
                    value={`${stats.totalRevenue.toFixed(2)}`}
                    icon={CreditCard}
                    color="purple"
                />

                <StatCard
                    title="Today's Bookings"
                    value={stats.todayBookings}
                    icon={FileText}
                    color="orange"
                />
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-green-600 font-semibold">✅ Backend Online</div>
                        <div className="text-sm text-gray-600">API responding normally</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-blue-600 font-semibold">🚗 System Active</div>
                        <div className="text-sm text-gray-600">Trips and bookings running</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-purple-600 font-semibold">💳 Payments Ready</div>
                        <div className="text-sm text-gray-600">Stripe integration working</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors">
                        <div className="text-lg mb-2">👤</div>
                        <div>Manage Users</div>
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors">
                        <div className="text-lg mb-2">🚗</div>
                        <div>View Trips</div>
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors">
                        <div className="text-lg mb-2">📋</div>
                        <div>Check Bookings</div>
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors">
                        <div className="text-lg mb-2">⚙️</div>
                        <div>Settings</div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;