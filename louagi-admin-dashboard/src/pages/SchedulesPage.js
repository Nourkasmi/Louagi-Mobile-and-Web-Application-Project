import React from 'react';
import PageHeader from '../components/common/PageHeader';

export const SchedulesPage = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Schedules Management"
                subtitle="Manage trip schedules and timetables"
            />
            <div className="card p-6">
                <p className="text-gray-600">Schedules management interface coming soon...</p>
            </div>
        </div>
    );
};

export default SchedulesPage;
