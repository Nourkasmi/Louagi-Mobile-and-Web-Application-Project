// src/components/destinations/DestinationPagination.js
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DestinationPagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems = 0
}) => {
    if (totalPages <= 1) {
        return null;
    }

    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    return (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
                {totalItems > 0 && ` (${totalItems} total destinations)`}
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                    disabled={!canGoPrevious}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center space-x-1">
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                    </div>
                </button>
                <button
                    onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={!canGoNext}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center space-x-1">
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                    </div>
                </button>
            </div>
        </div>
    );
};

export default DestinationPagination;
