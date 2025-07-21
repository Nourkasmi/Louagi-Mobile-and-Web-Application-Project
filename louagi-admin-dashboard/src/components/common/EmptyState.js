import React from 'react';
import { FileText, Plus } from 'lucide-react';

const EmptyState = ({
    icon: Icon = FileText,
    title = "No items found",
    description = "No items have been created yet.",
    actionLabel,
    onAction,
    showAction = false
}) => {
    return (
        <div className="bg-white rounded-lg shadow border p-8">
            <div className="text-center py-8">
                <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 mb-4">{description}</p>

                {showAction && onAction && actionLabel && (
                    <button
                        onClick={onAction}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

export default EmptyState;