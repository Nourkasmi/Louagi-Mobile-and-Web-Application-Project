import React from 'react';
import { Search } from 'lucide-react';

const SearchAndFilters = ({ filters, setFilters, onSearch, selectedUsers, onBulkAction }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xl">
        <form onSubmit={onSearch} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search users by name, email, or phone..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            <div className="flex items-center space-x-3">
                <select
                    value={filters.role}
                    onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="driver">Driver</option>
                    <option value="passenger">Passenger</option>
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>

                <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                    Search
                </button>
            </div>
        </form>

        {selectedUsers.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-sm font-medium text-blue-900">
                    {selectedUsers.length} user(s) selected
                </span>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onBulkAction('activate')}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                        Activate
                    </button>
                    <button
                        onClick={() => onBulkAction('deactivate')}
                        className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-colors"
                    >
                        Deactivate
                    </button>
                    <button
                        onClick={() => onBulkAction('delete')}
                        className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        )}
    </div>
);

export default SearchAndFilters;