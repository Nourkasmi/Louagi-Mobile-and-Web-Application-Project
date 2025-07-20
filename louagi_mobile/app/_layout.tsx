//  app/_layout.tsx 

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import store, { isStoreHealthy } from '../src/store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Error Boundary for Redux and general crashes
class ReduxErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; retryCount: number }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('🚨 Redux Error Boundary caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Redux Error Boundary details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = async () => {
    try {
      // Clear potentially corrupted data
      await AsyncStorage.multiRemove(['louagi_token', 'louagi_user']);
      global.authToken = undefined;

      this.setState({
        hasError: false,
        error: undefined,
        retryCount: this.state.retryCount + 1,
      });

      console.log('🔄 Error boundary recovery attempted');
    } catch (error) {
      console.error('❌ Recovery failed:', error);
      Alert.alert('Recovery Failed', 'Please restart the app manually.', [{ text: 'OK' }]);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{
          flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f8f9fa'
        }}>
          <Text style={{
            fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center'
          }}>
            App Error Detected
          </Text>
          <Text style={{
            fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20
          }}>
            The app encountered an error. This usually resolves with a restart.
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            style={{
              backgroundColor: '#0066cc',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              marginBottom: 12
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>
              Try Recovery {this.state.retryCount > 0 && `(${this.state.retryCount})`}
            </Text>
          </TouchableOpacity>
          {this.state.retryCount >= 2 && (
            <Text style={{
              fontSize: 12, color: '#999', textAlign: 'center'
            }}>
              If this persists, please restart the app completely.
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

// Safe Redux Provider with health checks
const SafeReduxProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStoreReady, setIsStoreReady] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStore = async () => {
      try {
        if (!isStoreHealthy()) throw new Error('Store failed health check');
        setIsStoreReady(true);
      } catch (error) {
        console.error('❌ Store initialization error:', error);
        setStoreError('Failed to initialize app state');
        setTimeout(() => {
          setIsStoreReady(true);
        }, 2000);
      }
    };
    initializeStore();
  }, []);

  if (!isStoreReady && !storeError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>Starting Louagi...</Text>
      </View>
    );
  }

  if (storeError && !isStoreReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, color: '#f44336', textAlign: 'center', marginBottom: 16 }}>
          Initialization Error
        </Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
          {storeError}
        </Text>
      </View>
    );
  }

  return (
    <Provider store={store}>{children}</Provider>
  );
};

export default function RootLayout() {
  useEffect(() => {
    const restoreAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem('louagi_token');
        global.authToken = token || undefined;
      } catch (error) {
        global.authToken = undefined;
        console.error('❌ Failed to restore token:', error);
      }
    };
    restoreAuthToken();
  }, []);

  return (
    <ReduxErrorBoundary>
      <SafeReduxProvider>
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(passenger)" />
            <Stack.Screen name="(driver)" />
          </Stack>
        </PaperProvider>
      </SafeReduxProvider>
    </ReduxErrorBoundary>
  );
}
