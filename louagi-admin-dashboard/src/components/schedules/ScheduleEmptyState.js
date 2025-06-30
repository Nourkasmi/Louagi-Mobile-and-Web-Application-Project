// src/components/schedules/ScheduleEmptyState.js
import React from 'react';
import { Calendar } from 'lucide-react';

const ScheduleEmptyState = ({ hasFilters, onCreateFirst }) => {
    return (
        <div className="bg-white rounded-lg shadow border p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
            <p className="text-gray-600">
                {hasFilters
                    ? 'Try adjusting your filters to see more schedules.'
                    : 'No schedules have been created yet.'}
            </p>
            {!hasFilters && (
                <button
                    onClick={onCreateFirst}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Create First Schedule
                </button>
            )}
        </div>
    );
};

export default ScheduleEmptyState;