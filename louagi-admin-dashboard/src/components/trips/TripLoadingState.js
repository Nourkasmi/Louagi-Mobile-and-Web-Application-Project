// src/components/trips/TripLoadingState.js
import React from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import PageHeader from '../common/PageHeader';

const TripLoadingState = () => {
    return (
        <div className="space-y-6">
            <PageHeader
                title="Trips Management"
                subtitle="Loading trips..."
            />
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="large" text="Loading trips..." />
            </div>
        </div>
    );
};

export default TripLoadingState;