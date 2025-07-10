// 📁 src/store/authSlice.ts - FIXED Auth Slice with Error Handling
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../services/api';

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  error?: string | null;
  lastLogin?: string | null;
};

// 🔧 FIXED: Enhanced initial state with error handling
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  error: null,
  lastLogin: null,
};

type LoginSuccessPayload = {
  user: User;
  token: string;
};

type LoginErrorPayload = {
  error: string;
};

// 🔧 FIXED: Enhanced auth slice with better error handling
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<LoginSuccessPayload>) => {
      try {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
        state.lastLogin = new Date().toISOString();
      } catch (error) {
        console.error('❌ Login success reducer error:', error);
        // Fallback to safe state
        return {
          ...initialState,
          error: 'Failed to process login',
        };
      }
    },
    
    loginError: (state, action: PayloadAction<LoginErrorPayload>) => {
      try {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = action.payload.error;
      } catch (error) {
        console.error('❌ Login error reducer error:', error);
        return initialState;
      }
    },
    
    logout: (state) => {
      try {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.error = null;
        state.lastLogin = null;
      } catch (error) {
        console.error('❌ Logout reducer error:', error);
        return initialState;
      }
    },
    
    clearError: (state) => {
      try {
        state.error = null;
      } catch (error) {
        console.error('❌ Clear error reducer error:', error);
      }
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      try {
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      } catch (error) {
        console.error('❌ Update user reducer error:', error);
      }
    },
    
    // 🔧 FIXED: Add reset action for store health
    resetAuth: () => {
      try {
        return initialState;
      } catch (error) {
        console.error('❌ Reset auth reducer error:', error);
        return initialState;
      }
    },
  },
  
  // 🔧 FIXED: Add extra reducers for global store reset
  extraReducers: (builder) => {
    builder.addCase('RESET_STORE', () => {
      return initialState;
    });
  },
});

// 🔧 FIXED: Safe action creators with error boundaries
const safeActionCreator = <T extends any[]>(
  actionCreator: (...args: T) => any,
  fallbackAction: any
) => {
  return (...args: T) => {
    try {
      return actionCreator(...args);
    } catch (error) {
      console.error('❌ Action creator error:', error);
      return fallbackAction;
    }
  };
};

export const { 
  loginSuccess, 
  loginError, 
  logout, 
  clearError, 
  updateUser, 
  resetAuth 
} = authSlice.actions;

// 🔧 FIXED: Export safe action creators
export const safeLoginSuccess = safeActionCreator(
  loginSuccess, 
  { type: 'auth/loginError', payload: { error: 'Login processing failed' } }
);

export const safeLogout = safeActionCreator(
  logout,
  { type: 'auth/resetAuth' }
);

export default authSlice.reducer;