// app/_layout.tsx - UPDATED Root Layout with Clean Route Groups
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import store from '../src/store/store';
import { offlineService } from '../src/services/offlineService';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function RootLayout() {
  useEffect(() => {
  // Load token from AsyncStorage at startup
  const restoreAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('louagi_token');
      if (token) {
        global.authToken = token;
        // Optionally: dispatch(loginSuccess({ user, token })) if you store user in AsyncStorage too
        // But usually, you'll auto-fetch user profile after login elsewhere
        console.log('JWT restored from AsyncStorage!');
      } else {
        global.authToken = undefined;
      }
    } catch (error) {
      global.authToken = undefined;
      console.error('Failed to restore token:', error);
    }
  };

  restoreAuthToken();

  // Initialize services
  const initializeServices = async () => {
    try {
      await offlineService.initialize();
      console.log('App services initialized successfully');
    } catch (error) {
      console.error('Error initializing app services:', error);
    }
  };

  initializeServices();

  return () => {
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
        </Stack>
      </PaperProvider>
    </Provider>
  );
}