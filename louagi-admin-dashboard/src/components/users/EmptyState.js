import React from 'react';
import { Users, UserPlus } from 'lucide-react';

const EmptyState = ({ onCreateUser }) => (
    <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-xl text-center">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
        <p className="text-gray-600 mb-4">Try adjusting your search criteria or add a new user.</p>
        <button
            onClick={onCreateUser}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
            <UserPlus className="w-4 h-4 mr-2" />
            Add First User
        </button>
    </div>
);

export default EmptyState;