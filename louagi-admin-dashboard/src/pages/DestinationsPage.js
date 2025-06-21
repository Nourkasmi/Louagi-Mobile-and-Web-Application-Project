import React from 'react';
import PageHeader from '../components/common/PageHeader';

export const DestinationsPage = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Destinations Management"
                subtitle="Manage routes and destinations"
            />
            <div className="card p-6">
                <p className="text-gray-600">Destinations management interface coming soon...</p>
            </div>
        </div>
    );
};

export default DestinationsPage;