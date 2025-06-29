// src/hooks/useUsersData.js
import { useState, useEffect, useCallback } from 'react';
import { showToast } from '../utils/toast';

export const useUsersData = () => {
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

    const fetchUsers = useCallback(async () => {
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
    }, [pagination.page, filters]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const createUser = async (userData) => {
        try {
            console.log('🔄 Creating user with data:', userData);
            setActionLoading(prev => ({ ...prev, create: true }));

            const token = localStorage.getItem('louagi_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const requestData = {
                username: userData.username.trim(),
                email: userData.email.trim(),
                password: userData.password,
                phone: userData.phone.trim(),
                role: userData.role
            };

            // Add driver specific fields if role is driver
            if (userData.role === 'driver') {
                requestData.license_no = userData.license_no.trim();
                requestData.experience = parseInt(userData.experience) || 0;
                requestData.license_expiry = userData.license_expiry;
            }

            console.log('📤 Sending request data:', requestData);

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${baseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            console.log('📥 Response status:', response.status);

            let data;
            try {
                data = await response.json();
                console.log('📥 Response data:', data);
            } catch (parseError) {
                console.error('❌ Failed to parse JSON response:', parseError);
                throw new Error('Invalid response from server');
            }

            if (response.ok && (data.success || data.user)) {
                console.log('✅ User created successfully');
                await fetchUsers(); // Refresh the users list
                showToast('User created successfully!', 'success');
                return { success: true };
            } else {
                const errorMessage = data.message || data.error || `HTTP ${response.status}: Failed to create user`;
                console.error('❌ User creation failed:', errorMessage);
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error('❌ Error creating user:', err);
            const errorMessage = err.message || 'Failed to create user';
            showToast('Error creating user: ' + errorMessage, 'error');
            return { success: false, error: errorMessage };
        } finally {
            setActionLoading(prev => ({ ...prev, create: false }));
        }
    };

    const deleteUser = async (userId, username) => {
        try {
            setActionLoading(prev => ({ ...prev, [userId]: true }));
            const token = localStorage.getItem('louagi_token');

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${baseUrl}/users/${userId}`, {
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
                showToast('User deleted successfully!', 'success');
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to delete user');
            }
        } catch (err) {
            console.error('Error deleting user:', err);
            showToast('Error deleting user: ' + err.message, 'error');
            return { success: false, error: err.message };
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            setActionLoading(prev => ({ ...prev, [userId]: true }));
            const token = localStorage.getItem('louagi_token');

            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${baseUrl}/users/${userId}`, {
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
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to update user status');
            }
        } catch (err) {
            console.error('Error updating user status:', err);
            showToast('Error updating user status: ' + err.message, 'error');
            return { success: false, error: err.message };
        } finally {
            setActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
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
            default:
                break;
        }
        setSelectedUsers([]);
    };

    return {
        users,
        loading,
        error,
        actionLoading,
        pagination,
        filters,
        selectedUsers,
        fetchUsers,
        createUser,
        deleteUser,
        toggleUserStatus,
        handleSearch,
        handlePageChange,
        handleBulkAction,
        setFilters,
        setSelectedUsers
    };
};