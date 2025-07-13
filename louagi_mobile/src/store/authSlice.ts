// 📁 src/store/authSlice.ts - FINAL FIXED Auth Slice with Input Validation
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../services/api';

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  error?: string | null;
  lastLogin?: string | null;
};

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  error: null,
  lastLogin: null,
};

// Strict input validation
const validateUser = (user: any): user is User => {
  if (!user || typeof user !== 'object') return false;
  if (!user.id || !user.username || typeof user.username !== 'string') return false;
  if (!user.email || typeof user.email !== 'string') return false;
  if (!user.role || !['passenger', 'driver', 'admin'].includes(user.role)) return false;
  if (user.id && typeof user.id === 'number' && (isNaN(user.id) || !isFinite(user.id))) return false;
  return true;
};

const validateToken = (token: any): token is string => {
  return typeof token === 'string' && token.length > 0;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      try {
        const { user, token } = action.payload;
        if (!validateUser(user)) {
          state.error = 'Invalid user data received';
          return;
        }
        if (!validateToken(token)) {
          state.error = 'Invalid authentication token';
          return;
        }
        state.isAuthenticated = true;
        state.user = user;
        state.token = token;
        state.error = null;
        state.lastLogin = new Date().toISOString();
      } catch (error) {
        state.error = 'Failed to process login';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      }
    },

    loginError: (state, action: PayloadAction<{ error: string }>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload.error || 'Login failed';
    },

    logout: (state) => {
      Object.assign(state, initialState);
    },

    clearError: (state) => {
      state.error = null;
    },

    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user && action.payload) {
        const updatedUser = { ...state.user, ...action.payload };
        if (validateUser(updatedUser)) {
          state.user = updatedUser;
        } else {
          state.error = 'Invalid user update data';
        }
      }
    },

    resetAuth: () => initialState,
  }
});

export const {
  loginSuccess,
  loginError,
  logout,
  clearError,
  updateUser,
  resetAuth
} = authSlice.actions;

export default authSlice.reducer;
