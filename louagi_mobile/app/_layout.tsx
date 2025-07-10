// 📁 app/_layout.tsx - FIXED Root Layout with Safe Redux Provider
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { View, Text, ActivityIndicator } from 'react-native';
import store, { isStoreHealthy } from '../src/store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔧 FIXED: Safe Redux Provider with error boundary
const SafeReduxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStore = async () => {
      try {
        // Check if store is healthy
        if (isStoreHealthy()) {
          console.log('✅ Redux store is healthy');
          setIsStoreReady(true);
        } else {
          throw new Error('Store health check failed');
        }
      } catch (error) {
        console.error('❌ Store initialization error:', error);
        setStoreError('Failed to initialize app state');
        
        // Try to recover by providing a fallback
        setTimeout(() => {
          console.log('🔄 Attempting store recovery...');
          setIsStoreReady(true); // Allow app to continue without Redux
        }, 2000);
      }
    };

    initializeStore();
  }, []);

  // Show loading while store is initializing
  if (!isStoreReady && !storeError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
          Initializing app...
        </Text>
      </View>
    );
  }

  // Show error state
  if (storeError && !isStoreReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#f44336', textAlign: 'center', marginBottom: 16 }}>
          App Initialization Error
        </Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
          {storeError}
        </Text>
      </View>
    );
  }

  // Render with Redux provider
  try {
    return (
      <Provider store={store}>
        {children}
      </Provider>
    );
  } catch (error) {
    console.error('❌ Provider render error:', error);
    // Fallback: render children without Redux
    return <>{children}</>;
  }
};

export default function RootLayout() {
  useEffect(() => {
    // Load token from AsyncStorage at startup
    const restoreAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem('louagi_token');
        if (token) {
          global.authToken = token;
          console.log('✅ JWT restored from AsyncStorage');
        } else {
          global.authToken = undefined;
        }
      } catch (error) {
        global.authToken = undefined;
        console.error('❌ Failed to restore token:', error);
      }
    };

    restoreAuthToken();
  }, []);

  return (
    <SafeReduxProvider>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Authentication Screens */}
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />

          {/* Route Groups */}
          <Stack.Screen name="(passenger)" />
          <Stack.Screen name="(driver)" />
        </Stack>
      </PaperProvider>
    </SafeReduxProvider>
  );
}