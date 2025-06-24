import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import {
    Users,
    Search,
    Filter,
    UserPlus,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Shield,
    Car,
    User,
    Mail,
    Phone,
    Calendar,
    Download,
    Upload,
    RefreshCw,
    X,
    Check,
    AlertCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    UserCheck,
    UserX
} from 'lucide-react';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12, // Changed to 12 for better card grid layout
        total: 0,
        totalPages: 0
    });
    const [filters, setFilters] = useState({
        search: '',
        role: '',
        status: ''
    });
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

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
            case 'admin': return <Shield className="w-4 h-4" />;
            case 'driver': return <Car className="w-4 h-4" />;
            case 'passenger': return <User className="w-4 h-4" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'text-purple-700 bg-purple-100 border-purple-200';
            case 'driver': return 'text-blue-700 bg-blue-100 border-blue-200';
            case 'passenger': return 'text-green-700 bg-green-100 border-green-200';
            default: return 'text-gray-700 bg-gray-100 border-gray-200';
        }
    };

    const handleUserAction = (action, user) => {
        switch (action) {
            case 'view':
                setSelectedUser(user);
                setShowUserModal(true);
                break;
            case 'edit':
                console.log('Edit user:', user);
                // You can add edit functionality here
                break;
            case 'delete':
                deleteUser(user.id, user.username);
                break;
            case 'toggle-status':
                // You can implement status toggle API call here
                setUsers(users.map(u =>
                    u.id === user.id ? { ...u, isActive: !u.isActive } : u
                ));
                break;
        }
    };

    const handleBulkAction = (action) => {
        if (selectedUsers.length === 0) return;

        switch (action) {
            case 'activate':
                // Implement bulk activate API call
                setUsers(users.map(u =>
                    selectedUsers.includes(u.id) ? { ...u, isActive: true } : u
                ));
                break;
            case 'deactivate':
                // Implement bulk deactivate API call
                setUsers(users.map(u =>
                    selectedUsers.includes(u.id) ? { ...u, isActive: false } : u
                ));
                break;
            case 'delete':
                if (window.confirm(`Delete ${selectedUsers.length} selected users?`)) {
                    // Implement bulk delete API call
                    setUsers(users.filter(u => !selectedUsers.includes(u.id)));
                }
                break;
        }
        setSelectedUsers([]);
    };

    const UserCard = ({ user }) => (
        <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
            <div className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                                {user.username?.charAt(0) || '?'}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.isActive ? 'bg-green-500' : 'bg-gray-400'
                                }`}></div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{user.username}</h3>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border mt-2 ${getRoleColor(user.role)}`}>
                                {getRoleIcon(user.role)}
                                <span className="ml-1 capitalize">{user.role}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handleUserAction('view', user)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleUserAction('edit', user)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        {user.role !== 'admin' && (
                            <button
                                onClick={() => handleUserAction('delete', user)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Phone:</span>
                            <p className="font-medium">{user.phone}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Joined:</span>
                            <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {user.isActive ? (
                                <UserCheck className="w-3 h-3 mr-1" />
                            ) : (
                                <UserX className="w-3 h-3 mr-1" />
                            )}
                            {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-xs text-gray-500">
                            ID: {user.id?.toString().slice(0, 8)}...
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const UserModal = ({ user, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="flex items-center space-x-6 mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                            {user.username?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">{user.username}</h3>
                            <p className="text-gray-600">{user.email}</p>
                            <div className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border mt-2 ${getRoleColor(user.role)}`}>
                                {getRoleIcon(user.role)}
                                <span className="ml-2 capitalize">{user.role}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm">{user.email}</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm">{user.phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Account Status</h4>
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span className="text-sm font-medium">{user.isActive ? 'Active' : 'Inactive'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Account Details</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <span className="text-xs text-gray-500">Joined</span>
                                            <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <Users className="w-4 h-4 text-gray-500" />
                                        <div>
                                            <span className="text-xs text-gray-500">User ID</span>
                                            <p className="text-sm font-medium font-mono">{user.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={() => handleUserAction('toggle-status', user)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${user.isActive
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                        >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                            onClick={() => handleUserAction('edit', user)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Edit User
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <LoadingSpinner text="Loading users..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="p-6 space-y-6">
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
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Users Management
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {pagination.total} users in total • {users.filter(u => u.isActive).length} active • Connected to backend
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </button>
                        <button
                            onClick={fetchUsers}
                            className="flex items-center px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                        <button className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add User
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search users by name, email, or phone..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="flex items-center space-x-3">
                            <select
                                value={filters.role}
                                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="driver">Driver</option>
                                <option value="passenger">Passenger</option>
                            </select>

                            <select
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>

                            <button
                                onClick={handleSearch}
                                className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </div>

                    {selectedUsers.length > 0 && (
                        <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <span className="text-sm font-medium text-blue-900">
                                {selectedUsers.length} user(s) selected
                            </span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleBulkAction('activate')}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                                >
                                    Activate
                                </button>
                                <button
                                    onClick={() => handleBulkAction('deactivate')}
                                    className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-colors"
                                >
                                    Deactivate
                                </button>
                                <button
                                    onClick={() => handleBulkAction('delete')}
                                    className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Users Grid */}
                {users.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-xl text-center">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                        <p className="text-gray-600">Try adjusting your search criteria or add a new user.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map((user) => (
                            <UserCard key={user.id} user={user} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
                        <div className="text-sm text-gray-600">
                            Showing page {pagination.page} of {pagination.totalPages}
                            ({pagination.total} total users)
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page === 1}
                                className="p-2 border border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex items-center space-x-1">
                                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pagination.page === page
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-2 border border-gray-200 rounded-lg hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Role Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['admin', 'driver', 'passenger'].map(role => {
                        const roleUsers = users.filter(user => user.role === role);
                        const activeCount = roleUsers.filter(user => user.isActive).length;

                        return (
                            <div key={role} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-3 rounded-xl ${getRoleColor(role)}`}>
                                        {getRoleIcon(role)}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900">{roleUsers.length}</p>
                                        <p className="text-sm text-gray-600 capitalize">{role}s</p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span className="text-green-600 font-medium">{activeCount} active</span>
                                    {roleUsers.length > activeCount && (
                                        <span className="text-gray-500"> • {roleUsers.length - activeCount} inactive</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* User Modal */}
                {showUserModal && selectedUser && (
                    <UserModal
                        user={selectedUser}
                        onClose={() => {
                            setShowUserModal(false);
                            setSelectedUser(null);
                        }}
                    />
                )}

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;
