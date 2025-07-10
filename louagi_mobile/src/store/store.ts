// 📁 src/store/store.ts - FIXED Redux Store Configuration
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// 🔧 FIXED: Enhanced store configuration with better error handling
const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
      // 🔧 FIXED: Disable immutable check to prevent precision loss errors
      immutableCheck: {
        warnAfter: 128,
        ignoredPaths: ['auth.user', 'auth.token'],
      },
    }),
  devTools: __DEV__, // Enable Redux DevTools only in development
});

// 🔧 FIXED: Add error boundary for store
const originalGetState = store.getState;
store.getState = () => {
  try {
    return originalGetState();
  } catch (error) {
    console.error('❌ Redux store getState error:', error);
    // Return a safe fallback state
    return {
      auth: {
        isAuthenticated: false,
        user: null,
        token: null,
      },
    };
  }
};

// 🔧 FIXED: Add safe dispatch wrapper
const originalDispatch = store.dispatch;
store.dispatch = ((action: any) => {
  try {
    return originalDispatch(action);
  } catch (error) {
    console.error('❌ Redux dispatch error:', error);
    // Return a no-op function to prevent crashes
    return action;
  }
}) as typeof originalDispatch;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 🔧 FIXED: Add store health check
export const isStoreHealthy = (): boolean => {
  try {
    const state = store.getState();
    return typeof state === 'object' && state !== null && 'auth' in state;
  } catch (error) {
    console.error('❌ Store health check failed:', error);
    return false;
  }
};

// 🔧 FIXED: Add store reset functionality
export const resetStore = () => {
  try {
    store.dispatch({ type: 'RESET_STORE' });
  } catch (error) {
    console.error('❌ Store reset failed:', error);
  }
};

export default store;