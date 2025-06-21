import React from 'react';
import PageHeader from '../components/common/PageHeader';

const DriversPage = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Drivers Management"
                subtitle="Manage all drivers and their vehicles"
            />
            <div className="card p-6">
                <p className="text-gray-600">Drivers management interface coming soon...</p>
            </div>
        </div>
    );
};

export default DriversPage;