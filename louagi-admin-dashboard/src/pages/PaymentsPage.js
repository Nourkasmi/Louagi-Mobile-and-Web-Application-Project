import React from 'react';
import PageHeader from '../components/common/PageHeader';

export const PaymentsPage = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Payments Management"
                subtitle="Manage payments, refunds, and financial transactions"
            />
            <div className="card p-6">
                <p className="text-gray-600">Payments management interface coming soon...</p>
            </div>
        </div>
    );
};

export default PaymentsPage;
