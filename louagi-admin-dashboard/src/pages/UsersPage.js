import React, { useState, useEffect } from 'react';
import { Users, RefreshCw, UserPlus, AlertCircle } from 'lucide-react';
import { useUsersData } from '../hooks/useUsersData';
import SearchAndFilters from '../components/users/SearchAndFilters';
import UsersGrid from '../components/users/UsersGrid';
import Pagination from '../components/users/Pagination';
import RoleStatistics from '../components/users/RoleStatistics';
import UserModal from '../components/users/UserModal';
import CreateUserModal from '../components/users/CreateUserModal';
import DeleteConfirmModal from '../components/users/DeleteConfirmModal';
import LoadingState from '../components/users/LoadingState';
import ErrorState from '../components/users/ErrorState';
import EmptyState from '../components/users/EmptyState';

const UsersPage = () => {
    // Custom hook for all users data management
    const {
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
    } = useUsersData();

    // Modal states
    const [showUserModal, setShowUserModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);

    // Modal handlers
    const handleViewUser = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const handleDeleteUser = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const handleCloseModals = () => {
        setShowUserModal(false);
        setShowCreateModal(false);
        setShowDeleteModal(false);
        setSelectedUser(null);
        setUserToDelete(null);
    };

    // Loading state
    if (loading) {
        return <LoadingState />;
    }

    // Error state
    if (error) {
        return <ErrorState error={error} onRetry={fetchUsers} />;
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

                {/* Search and Filters */}
                <SearchAndFilters
                    filters={filters}
                    setFilters={setFilters}
                    onSearch={handleSearch}
                    selectedUsers={selectedUsers}
                    onBulkAction={handleBulkAction}
                />

                {/* Users Grid */}
                {users.length === 0 ? (
                    <EmptyState onCreateUser={() => setShowCreateModal(true)} />
                ) : (
                    <UsersGrid
                        users={users}
                        actionLoading={actionLoading}
                        onViewUser={handleViewUser}
                        onDeleteUser={handleDeleteUser}
                        onToggleStatus={toggleUserStatus}
                    />
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <Pagination
                        pagination={pagination}
                        onPageChange={handlePageChange}
                    />
                )}

                {/* Role Statistics */}
                <RoleStatistics users={users} />

                {/* Footer */}
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        ✅ Connected to backend: {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}
                    </p>
                </div>

                {/* Modals */}
                {showUserModal && selectedUser && (
                    <UserModal
                        user={selectedUser}
                        onClose={handleCloseModals}
                        onToggleStatus={toggleUserStatus}
                    />
                )}

                {showCreateModal && (
                    <CreateUserModal
                        onClose={handleCloseModals}
                        onCreateUser={createUser}
                        actionLoading={actionLoading}
                    />
                )}

                {showDeleteModal && userToDelete && (
                    <DeleteConfirmModal
                        user={userToDelete}
                        onClose={handleCloseModals}
                        onConfirm={deleteUser}
                        actionLoading={actionLoading}
                    />
                )}
            </div>
        </div>
    );
};

export default UsersPage;