import React from 'react';
import PageHeader from '../components/common/PageHeader';

export const QueuePage = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Queue Management"
                subtitle="Manage driver queues and waiting times"
            />
            <div className="card p-6">
                <p className="text-gray-600">Queue management interface coming soon...</p>
            </div>
        </div>
    );
};

export default QueuePage;
