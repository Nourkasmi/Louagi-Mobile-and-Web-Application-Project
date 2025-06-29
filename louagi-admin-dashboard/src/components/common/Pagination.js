// src/components/common/Pagination.js
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
    pagination,
    onPageChange,
    itemName = 'items'
}) => {
    if (pagination.totalPages <= 1) {
        return null;
    }

    const { currentPage, totalPages, total } = pagination;

    const renderPageButtons = () => {
        const buttons = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Add first page and ellipsis if needed
        if (startPage > 1) {
            buttons.push(
                <button
                    key={1}
                    onClick={() => onPageChange(1)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    1
                </button>
            );
            if (startPage > 2) {
                buttons.push(
                    <span key="ellipsis-start" className="px-2 text-gray-400">...</span>
                );
            }
        }

        // Add visible page numbers
        for (let page = startPage; page <= endPage; page++) {
            buttons.push(
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    {page}
                </button>
            );
        }

        // Add last page and ellipsis if needed
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                buttons.push(
                    <span key="ellipsis-end" className="px-2 text-gray-400">...</span>
                );
            }
            buttons.push(
                <button
                    key={totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    {totalPages}
                </button>
            );
        }

        return buttons;
    };

    return (
        <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-700">
                Showing page {currentPage} of {totalPages} ({total} total {itemName})
            </div>

            <div className="flex items-center space-x-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                </button>

                <div className="flex items-center space-x-1">
                    {renderPageButtons()}
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="flex items-center px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;