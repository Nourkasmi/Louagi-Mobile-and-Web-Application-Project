// app/_layout.tsx - FIXED Root Layout
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import store from '../src/store/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  useEffect(() => {
    // Load token from AsyncStorage at startup
    const restoreAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem('louagi_token');
        if (token) {
          global.authToken = token;
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

    // 🔧 REMOVED: offlineService initialization that was causing errors
    // If you need offline service, implement it properly first

  }, []);

  return (
    <Provider store={store}>
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
    </Provider>
  );
}