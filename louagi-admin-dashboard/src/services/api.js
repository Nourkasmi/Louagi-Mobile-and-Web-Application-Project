import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }

        // Handle other errors
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        return Promise.reject({ ...error, message: errorMessage });
    }
);

// Auth API calls
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
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
    updateStatus: (id, status) => api.put(`/trips/${id}/status`, { status }),
};

// Bookings API calls
export const bookingsAPI = {
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    updateStatus: (id, status, reason) => api.patch(`/bookings/${id}/status`, { status, cancellationReason: reason }),
    getStats: () => api.get('/bookings/stats'),
};

// Drivers API calls
export const driversAPI = {
    getAll: (params) => api.get('/drivers', { params }),
    getById: (id) => api.get(`/drivers/${id}`),
    update: (id, data) => api.put(`/drivers/${id}`, data),
};

// Stations API calls
export const stationsAPI = {
    getAll: (params) => api.get('/stations', { params }),
    getById: (id) => api.get(`/stations/${id}`),
    create: (data) => api.post('/stations', data),
    update: (id, data) => api.put(`/stations/${id}`, data),
    delete: (id) => api.delete(`/stations/${id}`),
};

// Destinations API calls
export const destinationsAPI = {
    getAll: (params) => api.get('/destinations', { params }),
    getById: (id) => api.get(`/destinations/${id}`),
    create: (data) => api.post('/destinations', data),
    update: (id, data) => api.put(`/destinations/${id}`, data),
    delete: (id) => api.delete(`/destinations/${id}`),
};

// Schedules API calls
export const schedulesAPI = {
    getAll: (params) => api.get('/schedules', { params }),
    getById: (id) => api.get(`/schedules/${id}`),
    create: (data) => api.post('/schedules', data),
    update: (id, data) => api.put(`/schedules/${id}`, data),
    delete: (id) => api.delete(`/schedules/${id}`),
};

// Payments API calls
export const paymentsAPI = {
    getAll: (params) => api.get('/payments', { params }),
    getById: (id) => api.get(`/payments/${id}`),
    getStats: () => api.get('/payments/stats'),
    createRefund: (id, data) => api.post(`/payments/${id}/refund`, data),
};

// Queue API calls
export const queueAPI = {
    getByStation: (params) => api.get('/queues', { params }),
    updateEntry: (id, data) => api.patch(`/queues/${id}`, data),
    getCount: (params) => api.get('/queues/count', { params }),
};

export default api;
