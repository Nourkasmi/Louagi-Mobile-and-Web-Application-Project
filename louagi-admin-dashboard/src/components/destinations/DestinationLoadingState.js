// src/components/destinations/DestinationLoadingState.js
import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import PageHeader from '../common/PageHeader';

const DestinationLoadingState = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Destinations Management"
                subtitle="Loading destinations..."
            />
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="large" text="Loading destinations..." />
            </div>
        </div>
    );
};

export default DestinationLoadingState;