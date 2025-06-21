import React from 'react';
import PageHeader from '../components/common/PageHeader';

export const SettingsPage = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                subtitle="System configuration and preferences"
            />
            <div className="card p-6">
                <p className="text-gray-600">Settings interface coming soon...</p>
            </div>
        </div>
    );
};

export default SettingsPage;
