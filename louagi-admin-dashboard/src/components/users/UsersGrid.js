import React from 'react';
import UserCard from './UserCard';

const UsersGrid = ({ users, actionLoading, onViewUser, onDeleteUser, onToggleStatus }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map((user) => (
            <UserCard
                key={user.id}
                user={user}
                actionLoading={actionLoading}
                onViewUser={onViewUser}
                onDeleteUser={onDeleteUser}
                onToggleStatus={onToggleStatus}
            />
        ))}
    </div>
);

export default UsersGrid;