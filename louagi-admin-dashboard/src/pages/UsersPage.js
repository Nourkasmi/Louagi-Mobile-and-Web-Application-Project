import React, { useState, useEffect } from 'react';
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
    UserX,
    Plus,
    Settings,
    Lock,
    Unlock,
    Star,
    StarOff
} from 'lucide-react';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // New user form state
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        password: '',
        phone: '',
        role: 'passenger',
        // Driver specific fields
        license_no: '',
        experience: 0,
        license_expiry: ''
    });

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, filters, sortBy, sortOrder]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

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

    const createUser = async (userData = null) => {
        try {
            setActionLoading(prev => ({ ...prev, create: true }));
            const token = localStorage.getItem('louagi_token');

            // Use passed userData or fallback to newUser state
            const userToCreate = userData || newUser;

            // Prepare user data based on role
            const requestData = {
                username: userToCreate.username,
                email: userToCreate.email,
                password: userToCreate.password,
                phone: userToCreate.phone,
                role: userToCreate.role
            };

            // Add driver specific fields if role is driver
            if (userToCreate.role === 'driver') {
                requestData.license_no = userToCreate.license_no;
                requestData.experience = parseInt(userToCreate.experience) || 0;
                requestData.license_expiry = userToCreate.license_expiry;
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (data.success || response.ok) {
                await fetchUsers();
                setShowCreateModal(false);
                resetForm();
                showToast('User created successfully!', 'success');
            } else {
                throw new Error(data.message || 'Failed to create user');
            }
        } catch (err) {
            console.error('Error creating user:', err);
            showToast('Error creating user: ' + err.message, 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, create: false }));
        }
    };

    const resetForm = () => {
        setNewUser({
            username: '',
            email: '',
            password: '',
            phone: '',
            role: 'passenger',
            license_no: '',
            experience: 0,
            license_expiry: ''
        });
    };

    const deleteUser = async (userId, username) => {
        try {
            setActionLoading(prev => ({ ...prev, [userId]: true }));
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
                setShowDeleteModal(false);
                setUserToDelete(null);
                showToast('User deleted successfully!', 'success');
            } else {
                throw new Error(data.message || 'Failed to delete user');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            showToast('Error deleting user: ' + err.message, 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            setActionLoading(prev => ({ ...prev, [userId]: true }));
            const token = localStorage.getItem('louagi_token');

            const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !currentStatus })
            });

            const data = await response.json();

            if (data.success) {
                setUsers(users.map(user =>
                    user.id === userId ? { ...user, isActive: !currentStatus } : user
                ));
                showToast(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`, 'success');
            } else {
                throw new Error(data.message || 'Failed to update user status');
            }
        } catch (err) {
            console.error('Error updating user status:', err);
            showToast('Error updating user status: ' + err.message, 'error');
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
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

    const handleBulkAction = (action) => {
        if (selectedUsers.length === 0) return;

        switch (action) {
            case 'activate':
                selectedUsers.forEach(userId => {
                    const user = users.find(u => u.id === userId);
                    if (user && !user.isActive) {
                        toggleUserStatus(userId, false);
                    }
                });
                break;
            case 'deactivate':
                selectedUsers.forEach(userId => {
                    const user = users.find(u => u.id === userId);
                    if (user && user.isActive) {
                        toggleUserStatus(userId, true);
                    }
                });
                break;
            case 'delete':
                if (window.confirm(`Delete ${selectedUsers.length} selected users?`)) {
                    selectedUsers.forEach(userId => {
                        const user = users.find(u => u.id === userId);
                        if (user) deleteUser(userId, user.username);
                    });
                }
                break;
        }
        setSelectedUsers([]);
    };

    const showToast = (message, type = 'info') => {
        // Simple toast implementation - you can replace with your preferred toast library
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${type === 'success' ? 'bg-green-500' :
                type === 'error' ? 'bg-red-500' :
                    'bg-blue-500'
            }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
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

    const UserCard = ({ user }) => (
        <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                {user.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.isActive ? 'bg-green-500' : 'bg-red-500'
                                }`}></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{user.username}</h3>
                            <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                                {getRoleIcon(user.role)}
                                <span className="ml-1 capitalize">{user.role}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                        >
                            <Eye className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            disabled={actionLoading[user.id]}
                            className={`p-2 rounded-lg transition-colors ${user.isActive
                                    ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                }`}
                            title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                            {actionLoading[user.id] ? (
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                            ) : (
                                user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />
                            )}
                        </button>

                        {user.role !== 'admin' && (
                            <button
                                onClick={() => {
                                    setUserToDelete(user);
                                    setShowDeleteModal(true);
                                }}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete User"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{user.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {user.isActive ? (
                            <UserCheck className="w-3 h-3 mr-1" />
                        ) : (
                            <UserX className="w-3 h-3 mr-1" />
                        )}
                        {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-400">
                        ID: {user.id?.toString().slice(0, 8)}...
                    </span>
                </div>
            </div>
        </div>
    );

    const UserModal = ({ user, onClose }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">User Details</h2>
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
                            {user.username?.charAt(0)?.toUpperCase() || '?'}
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
                                        <span className="text-sm">{user.phone || 'Not provided'}</span>
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
                                    <div>
                                        <span className="text-xs text-gray-500">User ID</span>
                                        <p className="text-sm font-medium font-mono">{user.id}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Created</span>
                                        <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Last Updated</span>
                                        <p className="text-sm font-medium">{new Date(user.updatedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${user.isActive
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                        >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const CreateUserModal = ({ onClose }) => {
        // Local state for form to prevent parent re-renders affecting inputs
        const [localUser, setLocalUser] = useState(newUser);

        // Update local state when newUser changes (on modal open)
        React.useEffect(() => {
            setLocalUser(newUser);
        }, [newUser]);

        const handleSubmit = (e) => {
            e.preventDefault();
            // Pass the local form data directly to createUser
            createUser(localUser);
        };

        const handleInputChange = (field, value) => {
            setLocalUser(prev => ({
                ...prev,
                [field]: value
            }));
        };

        const handleRoleChange = (role) => {
            setLocalUser(prev => ({
                ...prev,
                role,
                // Reset driver fields when switching away from driver
                ...(role !== 'driver' && {
                    license_no: '',
                    experience: 0,
                    license_expiry: ''
                })
            }));
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Create New User</h2>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={localUser.username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    minLength={3}
                                    maxLength={30}
                                    placeholder="johndoe"
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={localUser.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    placeholder="john@example.com"
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={localUser.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    minLength={8}
                                    placeholder="Password123"
                                    autoComplete="new-password"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Password must be at least 8 characters with uppercase, lowercase, and number
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={localUser.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    placeholder="+21612345678"
                                    autoComplete="off"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={localUser.role}
                                    onChange={(e) => handleRoleChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="passenger">Passenger</option>
                                    <option value="driver">Driver</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            {/* Driver specific fields - Always render but conditionally show */}
                            <div className={`space-y-4 transition-all duration-300 ${localUser.role === 'driver' ? 'block' : 'hidden'}`}>
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Driver Information</h4>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                                    <input
                                        type="text"
                                        value={localUser.license_no}
                                        onChange={(e) => handleInputChange('license_no', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required={localUser.role === 'driver'}
                                        placeholder="DRV-123456"
                                        autoComplete="off"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                                    <input
                                        type="number"
                                        value={localUser.experience}
                                        onChange={(e) => handleInputChange('experience', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required={localUser.role === 'driver'}
                                        min="0"
                                        max="50"
                                        placeholder="5"
                                        autoComplete="off"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry Date</label>
                                    <input
                                        type="date"
                                        value={localUser.license_expiry}
                                        onChange={(e) => handleInputChange('license_expiry', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required={localUser.role === 'driver'}
                                        min={new Date().toISOString().split('T')[0]}
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading.create}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {actionLoading.create ? (
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Creating...
                                        </div>
                                    ) : (
                                        'Create User'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const DeleteConfirmModal = ({ user, onClose, onConfirm }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
                <div className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
                    </div>

                    <p className="text-gray-600 mb-6">
                        Are you sure you want to delete <strong>{user.username}</strong>? This action cannot be undone.
                    </p>

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirm(user.id, user.username)}
                            disabled={actionLoading[user.id]}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                            {actionLoading[user.id] ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <div className="p-6 space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <div className="flex items-center">
                            <AlertCircle className="w-8 h-8 text-red-500 mr-3" />
                            <div>
                                <h3 className="text-lg font-medium text-red-800">Error Loading Users</h3>
                                <p className="text-red-700 mt-1">{error}</p>
                                <p className="text-sm text-red-600 mt-2">
                                    Make sure your backend is running on {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                                </p>
                                <button
                                    onClick={fetchUsers}
                                    className="mt-4 inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
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
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Users Management
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {pagination.total} users in total • {users.filter(u => u.isActive).length} active
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add User
                        </button>
                        <button
                            onClick={fetchUsers}
                            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
                    <form onSubmit={handleSearch} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
                                type="submit"
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </form>

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
                        <p className="text-gray-600 mb-4">Try adjusting your search criteria or add a new user.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add First User
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                                        <p className="text-3xl font-bold text-gray-900">{roleUsers.length}</p>
                                        <p className="text-sm text-gray-600 capitalize">{role}s</p>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span className="text-green-600 font-medium">{activeCount} active</span>
                                    {roleUsers.length > activeCount && (
                                        <span className="text-gray-500"> • {roleUsers.length - activeCount} inactive</span>
                                    )}
                                </div>
                                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${roleUsers.length > 0 ? (activeCount / roleUsers.length) * 100 : 0}%` }}
                                    ></div>
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

                {/* Create User Modal */}
                {showCreateModal && (
                    <CreateUserModal
                        onClose={() => {
                            setShowCreateModal(false);
                            resetForm();
                        }}
                    />
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && userToDelete && (
                    <DeleteConfirmModal
                        user={userToDelete}
                        onClose={() => {
                            setShowDeleteModal(false);
                            setUserToDelete(null);
                        }}
                        onConfirm={deleteUser}
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