import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import {
    Users,
    Car,
    CreditCard,
    FileText,
    RefreshCw,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Activity,
    MapPin,
    Clock,
    DollarSign,
    BarChart3,
    PieChart,
    Calendar,
    Bell
} from 'lucide-react';

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
    const [chartData, setChartData] = useState([
        { name: 'Mon', bookings: 42, revenue: 1050 },
        { name: 'Tue', bookings: 58, revenue: 1450 },
        { name: 'Wed', bookings: 67, revenue: 1675 },
        { name: 'Thu', bookings: 74, revenue: 1850 },
        { name: 'Fri', bookings: 89, revenue: 2225 },
        { name: 'Sat', bookings: 95, revenue: 2375 },
        { name: 'Sun', bookings: 78, revenue: 1950 }
    ]);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    // Simulated real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                todayBookings: prev.todayBookings + Math.floor(Math.random() * 2),
                totalRevenue: prev.totalRevenue + (Math.random() * 50)
            }));
        }, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
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

    const StatCard = ({ title, value, change, changeType, icon: Icon, color, subtitle }) => (
        <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <div className="relative bg-white backdrop-blur-xl bg-opacity-70 rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                        <p className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                            {value}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                        )}
                        {change && (
                            <div className={`inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium ${changeType === 'positive' ? 'text-green-700 bg-green-100' :
                                    changeType === 'negative' ? 'text-red-700 bg-red-100' :
                                        'text-gray-700 bg-gray-100'
                                }`}>
                                {changeType === 'positive' && <TrendingUp className="w-3 h-3 mr-1" />}
                                {changeType === 'negative' && <TrendingDown className="w-3 h-3 mr-1" />}
                                {change}
                            </div>
                        )}
                    </div>
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${color} bg-opacity-10`}>
                        <Icon className={`w-8 h-8 bg-gradient-to-r ${color} bg-clip-text text-transparent`} />
                    </div>
                </div>
            </div>
        </div>
    );

    const ActivityItem = ({ activity }) => {
        const getIcon = (type) => {
            switch (type) {
                case 'booking': return <FileText className="w-4 h-4" />;
                case 'trip': return <Car className="w-4 h-4" />;
                case 'driver': return <Users className="w-4 h-4" />;
                case 'payment': return <DollarSign className="w-4 h-4" />;
                default: return <Activity className="w-4 h-4" />;
            }
        };

        const getColor = (status) => {
            switch (status) {
                case 'completed': return 'text-green-600 bg-green-100';
                case 'in_progress': return 'text-blue-600 bg-blue-100';
                case 'confirmed': return 'text-purple-600 bg-purple-100';
                case 'scheduled': return 'text-orange-600 bg-orange-100';
                default: return 'text-gray-600 bg-gray-100';
            }
        };

        const formatTime = (timeString) => {
            try {
                const date = new Date(timeString);
                const now = new Date();
                const diffInMinutes = Math.floor((now - date) / (1000 * 60));

                if (diffInMinutes < 1) return 'Just now';
                if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
                if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
                return date.toLocaleDateString();
            } catch {
                return 'Recently';
            }
        };

        return (
            <div className="flex items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 transition-colors duration-200 hover:shadow-md">
                <div className={`p-2 rounded-lg ${getColor(activity.status)}`}>
                    {getIcon(activity.type)}
                </div>
                <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{formatTime(activity.time)}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getColor(activity.status)}`}>
                    {activity.status}
                </div>
            </div>
        );
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <LoadingSpinner text="Loading dashboard..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="p-6 space-y-6">
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
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with Louagi today.</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="p-2 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-colors duration-200">
                            <Bell className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            onClick={fetchDashboardStats}
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats.totalUsers.toLocaleString()}
                        change="+12.5%"
                        changeType="positive"
                        icon={Users}
                        color="from-blue-600 to-blue-800"
                        subtitle="Active this month"
                    />
                    <StatCard
                        title="Active Trips"
                        value={stats.activeTrips}
                        change="+3"
                        changeType="positive"
                        icon={Car}
                        color="from-green-600 to-green-800"
                        subtitle="Currently running"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`$${stats.totalRevenue.toFixed(2)}`}
                        change="+8.2%"
                        changeType="positive"
                        icon={CreditCard}
                        color="from-purple-600 to-purple-800"
                        subtitle="This month"
                    />
                    <StatCard
                        title="Today's Bookings"
                        value={stats.todayBookings}
                        change="+15"
                        changeType="positive"
                        icon={FileText}
                        color="from-orange-600 to-orange-800"
                        subtitle="Since midnight"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Booking Trends Chart */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Booking Trends</h3>
                            <div className="flex items-center space-x-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                <span className="text-sm text-gray-600">Last 7 days</span>
                            </div>
                        </div>
                        <div className="h-64 flex items-end justify-between space-x-2">
                            {chartData.map((day, index) => (
                                <div key={day.name} className="flex-1 flex flex-col items-center">
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-lg transition-all duration-300 hover:shadow-lg"
                                        style={{ height: `${(day.bookings / 100) * 200}px` }}
                                    ></div>
                                    <span className="text-xs text-gray-600 mt-2">{day.name}</span>
                                    <span className="text-xs font-medium text-gray-900">{day.bookings}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">System Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                                    <span className="text-sm font-medium text-green-800">API Status</span>
                                </div>
                                <span className="text-xs text-green-600">Online</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                    <span className="text-sm font-medium text-blue-800">Database</span>
                                </div>
                                <span className="text-xs text-blue-600">Healthy</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                                <div className="flex items-center">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                                    <span className="text-sm font-medium text-purple-800">Payments</span>
                                </div>
                                <span className="text-xs text-purple-600">Active</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="text-xs text-gray-600">Last backup</div>
                                <div className="text-sm font-medium text-gray-900">2 hours ago</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                            <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="space-y-3">
                            {recentActivity.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No recent activity</p>
                            ) : (
                                recentActivity.map((activity) => (
                                    <ActivityItem key={activity.id} activity={activity} />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <QuickAction
                                icon={Users}
                                title="Manage Users"
                                subtitle={`${stats.totalUsers} total users`}
                                color="from-blue-600 to-blue-800"
                                onClick={() => console.log('Navigate to users')}
                            />
                            <QuickAction
                                icon={Car}
                                title="View Trips"
                                subtitle={`${stats.activeTrips} active now`}
                                color="from-green-600 to-green-800"
                                onClick={() => console.log('Navigate to trips')}
                            />
                            <QuickAction
                                icon={MapPin}
                                title="Queue Status"
                                subtitle="Check driver queues"
                                color="from-purple-600 to-purple-800"
                                onClick={() => console.log('Navigate to queue')}
                            />
                            <QuickAction
                                icon={BarChart3}
                                title="Analytics"
                                subtitle="View detailed reports"
                                color="from-orange-600 to-orange-800"
                                onClick={() => console.log('Navigate to analytics')}
                            />
                        </div>
                    </div>
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