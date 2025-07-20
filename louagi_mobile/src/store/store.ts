// src/store/store.ts 

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';


const nanDetectionMiddleware = (store: any) => (next: any) => (action: any) => {
  const checkForNaN = (obj: any, path = ''): boolean => {
    if (obj === null || obj === undefined) return false;
    if (typeof obj === 'number') {
      if (isNaN(obj) || !isFinite(obj)) {
        console.error(`🚨 NaN/Infinity detected at ${path}:`, obj);
        return true;
      }
    }
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        if (checkForNaN(value, `${path}.${key}`)) return true;
      }
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        if (checkForNaN(obj[i], `${path}[${i}]`)) return true;
      }
    }
    return false;
  };

  if (action.payload && checkForNaN(action.payload, `action.${action.type}.payload`)) {
    console.error('🚨 Blocking action with NaN values:', action);
    return;
  }
  const result = next(action);
  try {
    const state = store.getState();
    if (checkForNaN(state, 'store.state')) {
      console.error('🚨 NaN detected in store state after action:', action.type);
    }
  } catch (error) {
    console.error('🚨 Error checking store state:', error);
  }
  return result;
};

// Store configuration
const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['auth.user', 'auth.token'],
      },
      immutableCheck: {
        warnAfter: 256,
        ignoredPaths: ['auth'],
      },
    }).concat(nanDetectionMiddleware),
  devTools: __DEV__,
});

// Safe getState and dispatch wrappers
const originalGetState = store.getState;
store.getState = () => {
  try {
    const state = originalGetState();
    if (!state || typeof state !== 'object') {
      return { auth: { isAuthenticated: false, user: null, token: null } };
    }
    return state;
  } catch (error) {
    console.error('❌ Redux store getState error:', error);
    return { auth: { isAuthenticated: false, user: null, token: null } };
  }
};

const originalDispatch = store.dispatch;
store.dispatch = ((action: any) => {
  try {
    return originalDispatch(action);
  } catch (error) {
    console.error('❌ Redux dispatch error:', error);
    return action;
  }
}) as typeof originalDispatch;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Health check
export const isStoreHealthy = (): boolean => {
  try {
    const state = store.getState();
    return typeof state === 'object' && state !== null && 'auth' in state;
  } catch (error) {
    console.error('❌ Store health check failed:', error);
    return false;
  }
};

export default store;
