import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import { Users, UserCheck, UserX, Shield, Car, User, Search, RefreshCw, AlertCircle, Edit, Trash2, Eye } from 'lucide-react';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        role: ''
    });

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, filters]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Build query params for your existing backend
            const params = new URLSearchParams();
            if (filters.role) params.append('role', filters.role);
            if (filters.search) params.append('search', filters.search);
            params.append('page', pagination.page.toString());
            params.append('limit', pagination.limit.toString());

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${baseUrl}/users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                setUsers(data.users || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.total || 0,
                    totalPages: data.totalPages || 0
                }));
            } else {
                throw new Error('Failed to fetch users');
            }
        } catch (error) {
            console.error('Users fetch error:', error);
            setError(error.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    // Delete user function - connects to your backend
    const deleteUser = async (userId, username) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('louagi_token');

            const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setUsers(users.filter(user => user.id !== userId));
                setPagination(prev => ({ ...prev, total: prev.total - 1 }));
                alert('User deleted successfully!');
            } else {
                alert('Failed to delete user: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Error deleting user: ' + err.message);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchUsers();
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <Shield className="w-4 h-4 text-purple-600" />;
            case 'driver': return <Car className="w-4 h-4 text-blue-600" />;
            case 'passenger': return <User className="w-4 h-4 text-green-600" />;
            default: return <User className="w-4 h-4 text-gray-600" />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'driver': return 'bg-blue-100 text-blue-800';
            case 'passenger': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return <LoadingSpinner text="Loading users..." />;
    }

    if (error) {
        return (
            <div className="space-y-6">
                <PageHeader
                    title="Users Management"
                    subtitle="Manage all system users"
                />
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error Loading Users</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <p className="text-xs text-red-600 mt-2">
                                Make sure your backend is running on {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                            </p>
                            <button
                                onClick={fetchUsers}
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
                title="Users Management"
                subtitle={`${pagination.total} users in total • Connected to backend`}
                action={
                    <button
                        onClick={fetchUsers}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2 inline" />
                        Refresh
                    </button>
                }
            />

            {/* Filters */}
            <div className="bg-white rounded-lg shadow border p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="driver">Driver</option>
                            <option value="passenger">Passenger</option>
                        </select>
                    </div>
                    <button
                        onClick={handleSearch}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow border">
                <div className="p-6">
                    {users.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No users found
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">User</th>
                                        <th className="text-left py-3 px-4">Contact</th>
                                        <th className="text-left py-3 px-4">Role</th>
                                        <th className="text-left py-3 px-4">Status</th>
                                        <th className="text-left py-3 px-4">Joined</th>
                                        <th className="text-left py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                                        <User className="w-4 h-4 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{user.username}</div>
                                                        <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                <div>{user.email}</div>
                                                <div className="text-sm text-gray-500">{user.phone}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${getRoleColor(user.role)}`}>
                                                    {getRoleIcon(user.role)}
                                                    <span className="ml-1">{user.role}</span>
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {user.isActive ? (
                                                        <UserCheck className="w-3 h-3 mr-1" />
                                                    ) : (
                                                        <UserX className="w-3 h-3 mr-1" />
                                                    )}
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => alert(`View details for ${user.username}`)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => alert(`Edit ${user.username}`)}
                                                        className="text-gray-600 hover:text-gray-800"
                                                        title="Edit User"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => deleteUser(user.id, user.username)}
                                                            className="text-red-600 hover:text-red-800"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {pagination.page} of {pagination.totalPages}
                                ({pagination.total} total users)
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Role Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['admin', 'driver', 'passenger'].map(role => {
                    const count = users.filter(user => user.role === role).length;
                    return (
                        <div key={role} className="bg-white p-4 rounded-lg shadow border">
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg ${getRoleColor(role).replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 text-')}`}>
                                    {getRoleIcon(role)}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-500 capitalize">{role}s on this page</p>
                                    <p className="text-lg font-semibold text-gray-900">{count}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Connection Status */}
            <div className="text-xs text-gray-500 text-center">
                ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
            </div>
        </div>
    );
};

export default UsersPage;
