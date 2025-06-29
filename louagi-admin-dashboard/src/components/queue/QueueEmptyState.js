import React from 'react';
import { MapPin } from 'lucide-react';

const QueueEmptyState = ({ hasFiltersSelected }) => {
    if (!hasFiltersSelected) {
        return (
            <div className="bg-white rounded-lg shadow border p-8">
                <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select Queue to View
                    </h3>
                    <p className="text-gray-500">
                        Please select a station, schedule, and destination to view the driver queue
                    </p>
                </div>
            </div>
        );
    }

    return null;
};

export default QueueEmptyState;