export const ROLE_COLORS = {
    admin: 'text-purple-700 bg-purple-100 border-purple-200',
    driver: 'text-blue-700 bg-blue-100 border-blue-200',
    passenger: 'text-green-700 bg-green-100 border-green-200',
    default: 'text-gray-700 bg-gray-100 border-gray-200'
};

export const STATUS_COLORS = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    scheduled: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800'
};

export const API_ENDPOINTS = {
    users: '/users',
    trips: '/trips',
    bookings: '/bookings',
    drivers: '/drivers',
    stations: '/stations',
    schedules: '/schedules'
};

export const PAGINATION_DEFAULTS = {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
};
