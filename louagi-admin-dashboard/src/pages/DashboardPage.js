import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import StatCard from '../components/common/StatCard';
import { Users, Car, CreditCard, FileText, RefreshCw, AlertCircle } from 'lucide-react';

const DashboardPage = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeTrips: 0,
        totalRevenue: 0,
        todayBookings: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('📊 Fetching dashboard statistics...');

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

            // Fetch data from your existing backend endpoints
            const [usersResponse, tripsResponse, bookingsResponse] = await Promise.all([
                fetch(`${baseUrl}/users?limit=1`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${baseUrl}/trips?limit=10`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${baseUrl}/bookings?limit=10`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            // Check if responses are ok
            if (!usersResponse.ok || !tripsResponse.ok || !bookingsResponse.ok) {
                throw new Error('One or more API requests failed');
            }

            const [usersData, tripsData, bookingsData] = await Promise.all([
                usersResponse.json(),
                tripsResponse.json(),
                bookingsResponse.json()
            ]);

            // Calculate real statistics from your backend data
            const calculatedStats = {
                totalUsers: usersData.success ? (usersData.total || 0) : 0,
                activeTrips: tripsData.success ?
                    (tripsData.trips?.filter(trip =>
                        trip.status === 'scheduled' || trip.status === 'in_progress'
                    ).length || 0) : 0,
                totalRevenue: bookingsData.success ?
                    (bookingsData.bookings?.filter(booking => booking.status === 'completed')
                        .reduce((sum, booking) => sum + parseFloat(booking.amount || 0), 0) || 0) : 0,
                todayBookings: bookingsData.success ?
                    (bookingsData.bookings?.filter(booking => {
                        const today = new Date().toDateString();
                        const bookingDate = new Date(booking.createdAt).toDateString();
                        return bookingDate === today;
                    }).length || 0) : 0
            };

            setStats(calculatedStats);

            // Set recent activity from trips data
            if (tripsData.success && tripsData.trips) {
                setRecentActivity(tripsData.trips.slice(0, 5).map(trip => ({
                    id: trip.id,
                    type: 'trip',
                    description: trip.route?.description || `Trip ${trip.id.slice(0, 8)}`,
                    status: trip.status,
                    time: trip.departureTime || trip.createdAt
                })));
            }

            console.log('✅ Dashboard stats loaded:', calculatedStats);
        } catch (error) {
            console.error('❌ Dashboard error:', error);
            setError(error.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading dashboard..." />;
    }

    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Dashboard"
                    subtitle="Welcome to Louagi Admin Dashboard"
                />
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Dashboard Error</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <p className="text-xs text-red-600 mt-2">
                                Make sure your backend is running on {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                            </p>
                            <button
                                onClick={fetchDashboardStats}
                                className="mt-3 inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
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
                        <RefreshCw className="w-4 h-4 mr-2 inline" />
                        Refresh
                    </button>
                }
            />

            {/* Stats Cards - Now with REAL data */}
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
                    value={`$${stats.totalRevenue.toFixed(2)}`}
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
                        <div className="text-sm text-gray-600">{stats.activeTrips} active trips</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-purple-600 font-semibold">💳 Payments Ready</div>
                        <div className="text-sm text-gray-600">${stats.totalRevenue.toFixed(2)} total revenue</div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                {recentActivity.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No recent activity</p>
                ) : (
                    <div className="space-y-3">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {activity.status?.replace('_', ' ')} • {new Date(activity.time).toLocaleString()}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                            activity.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'
                                    }`}>
                                    {activity.status}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors">
                        <div className="text-lg mb-2">👤</div>
                        <div>Manage Users</div>
                        <div className="text-sm opacity-75 mt-1">{stats.totalUsers} total</div>
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors">
                        <div className="text-lg mb-2">🚗</div>
                        <div>View Trips</div>
                        <div className="text-sm opacity-75 mt-1">{stats.activeTrips} active</div>
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors">
                        <div className="text-lg mb-2">📋</div>
                        <div>Check Bookings</div>
                        <div className="text-sm opacity-75 mt-1">{stats.todayBookings} today</div>
                    </button>
                    <button className="bg-blue-600 text-white p-4 rounded-lg text-center hover:bg-blue-700 transition-colors">
                        <div className="text-lg mb-2">⚙️</div>
                        <div>Settings</div>
                        <div className="text-sm opacity-75 mt-1">System config</div>
                    </button>
                </div>
            </div>

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'} •
                Last updated: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
};

export default DashboardPage;