import React, { useState, useEffect } from 'react';
import { usersAPI, tripsAPI, bookingsAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import toast from 'react-hot-toast';

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

            // Fetch data from multiple endpoints in parallel
            const [usersRes, tripsRes, bookingsRes] = await Promise.all([
                usersAPI.getAll({ limit: 1 }),
                tripsAPI.getAll({ status: 'scheduled,in_progress', limit: 1 }),
                bookingsAPI.getStats()
            ]);

            setStats({
                totalUsers: usersRes.data.total || 0,
                activeTrips: tripsRes.data.total || 0,
                totalRevenue: bookingsRes.data.stats?.totalRevenue || 0,
                todayBookings: bookingsRes.data.stats?.todayBookings || 0
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            toast.error('Failed to load dashboard data');
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
                        className="btn-secondary text-sm"
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
                    icon={() => <span>👥</span>}
                    color="blue"
                />

                <StatCard
                    title="Active Trips"
                    value={stats.activeTrips}
                    icon={() => <span>🚗</span>}
                    color="green"
                />

                <StatCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toFixed(2)}`}
                    icon={() => <span>💰</span>}
                    color="purple"
                />

                <StatCard
                    title="Today's Bookings"
                    value={stats.todayBookings}
                    icon={() => <span>📅</span>}
                    color="orange"
                />
            </div>

            {/* System Status */}
            <div className="card p-6">
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
            <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button className="btn-primary text-center p-4">
                        <div className="text-lg mb-2">👤</div>
                        <div>Manage Users</div>
                    </button>
                    <button className="btn-primary text-center p-4">
                        <div className="text-lg mb-2">🚗</div>
                        <div>View Trips</div>
                    </button>
                    <button className="btn-primary text-center p-4">
                        <div className="text-lg mb-2">📋</div>
                        <div>Check Bookings</div>
                    </button>
                    <button className="btn-primary text-center p-4">
                        <div className="text-lg mb-2">⚙️</div>
                        <div>Settings</div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;