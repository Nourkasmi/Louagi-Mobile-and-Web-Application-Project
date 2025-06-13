import axios, { InternalAxiosRequestConfig } from 'axios';
import Config from '../config';

// Declare global for authToken
declare global {
  // eslint-disable-next-line no-var
  var authToken: string | undefined;
}

const api = axios.create({
  baseURL: Config.API_BASE_URL,
});

// Add token to requests if present
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = global.authToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Types ----
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  // Add other user fields as needed
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

// Auth endpoints
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
};

export const register = async (userData: Record<string, any>): Promise<AuthResponse> => {
  const res = await api.post<AuthResponse>('/auth/register', userData);
  return res.data;
};