import React from 'react';
import PageHeader from '../components/common/PageHeader';

const BookingsPage = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Bookings Management"
                subtitle="Manage all passenger bookings"
            />
            <div className="card p-6">
                <p className="text-gray-600">Bookings management interface coming soon...</p>
            </div>
        </div>
    );
};

export default BookingsPage;