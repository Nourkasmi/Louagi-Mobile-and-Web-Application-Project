// src/services/api.js
import axios from 'axios';
import Config from '../config';

const api = axios.create({
  baseURL: Config.API_BASE_URL,
});

api.interceptors.request.use(
  async (config) => {
    const token = global.authToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints
export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const register = async (userData) => {
  const res = await api.post('/auth/register', userData);
  return res.data;
};
