// src/components/schedules/SchedulePagination.js
import React from 'react';

const SchedulePagination = ({ pagination, onPageChange }) => {
    if (pagination.totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-between bg-white px-4 py-3 border rounded-lg">
            <div className="flex items-center text-sm text-gray-700">
                <span>
                    Showing page {pagination.page} of {pagination.totalPages}
                    ({pagination.total} total schedules)
                </span>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default SchedulePagination;