// app/_layout.tsx - UPDATED Root Layout with Clean Route Groups
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import store from '../src/store/store';
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
          {/* Authentication Screens */}
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          
          {/* ✅ NEW: Clean Route Groups */}
          <Stack.Screen name="(passenger)" />
          <Stack.Screen name="(driver)" />
          
          {/* Legacy screens - keeping for compatibility during transition */}
          <Stack.Screen name="booking" options={{ href: null }} />
          <Stack.Screen name="payment" options={{ href: null }} />
        </Stack>
      </PaperProvider>
    </Provider>
  );
}