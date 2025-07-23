import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('louagi_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('API Error:', error.response?.status, error.response?.data?.message || error.message);

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            localStorage.removeItem('louagi_token');
            window.location.href = '/login';
        }

        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        return Promise.reject({ ...error, message: errorMessage });
    }
);

// Auth API calls
export const authAPI = {
    login: (email, password) => {
        console.log('Attempting login for:', email);
        return api.post('/auth/login', { email, password });
    },
    logout: () => api.post('/auth/logout'),
    getCurrentUser: () => api.get('/auth/me'),
};

// Users API calls
export const usersAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};

// Trips API calls
export const tripsAPI = {
    getAll: (params) => api.get('/trips', { params }),
    getById: (id) => api.get(`/trips/${id}`),
    create: (data) => api.post('/trips', data),
    update: (id, data) => api.put(`/trips/${id}`, data),
    delete: (id) => api.delete(`/trips/${id}`),
    updateStatus: (id, data) => api.put(`/trips/${id}/status`, data),
};

// Bookings API calls
export const bookingsAPI = {
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    updateStatus: (id, status, reason) => api.patch(`/bookings/${id}/status`, { status, cancellationReason: reason }),
    getStats: () => api.get('/bookings/stats'),
};

// Dashboard API calls
export const dashboardAPI = {
    getStats: async () => {
        try {
            // Make parallel requests to get dashboard stats
            const [usersRes, tripsRes, bookingsRes] = await Promise.all([
                usersAPI.getAll({ limit: 1 }),
                tripsAPI.getAll({ limit: 1 }),
                bookingsAPI.getStats()
            ]);

            return {
                success: true,
                data: {
                    totalUsers: usersRes.data.total || 0,
                    activeTrips: tripsRes.data.total || 0,
                    totalRevenue: bookingsRes.data.stats?.totalRevenue || 0,
                    todayBookings: bookingsRes.data.stats?.todayBookings || 0
                }
            };
        } catch (error) {
            console.error('Dashboard stats error:', error);
            return {
                success: false,
                data: {
                    totalUsers: 0,
                    activeTrips: 0,
                    totalRevenue: 0,
                    todayBookings: 0
                }
            };
        }
    }
};

export default api;
