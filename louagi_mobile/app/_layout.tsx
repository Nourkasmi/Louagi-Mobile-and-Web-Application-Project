// app/_layout.tsx - CORRECTED Root Layout
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import store from '../src/store/store';
import { notificationService } from '../src/services/notifications';
import { offlineService } from '../src/services/offlineService';

export default function RootLayout() {
  useEffect(() => {
    // Initialize services when app starts
    const initializeServices = async () => {
      try {
        // Initialize notifications
        await notificationService.initialize();
        
        // Initialize offline service
        await offlineService.initialize();
        
        console.log('App services initialized successfully');
      } catch (error) {
        console.error('Error initializing app services:', error);
      }
    };

    initializeServices();

    // Cleanup services when app unmounts
    return () => {
      notificationService.cleanup();
      offlineService.cleanup();
    };
  }, []);

  return (
    <Provider store={store}>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="booking" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="search" />
          <Stack.Screen name="history" />
        </Stack>
      </PaperProvider>
    </Provider>
  );
}