// 📁 app/index.tsx - UPDATED (Clean Logic Only)
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { ActivityIndicator, View } from 'react-native';
import { RootState } from '../src/store/store';
import { styles } from './index.styles'; // 🆕 Import styles

export default function Index() {
  const auth = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay to let the router and layout mount first
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isReady) {
      if (!auth.isAuthenticated) {
        router.replace('/login');
        return;
      }

      // Route to correct app based on user role
      switch (auth.user?.role) {
        case 'passenger':
          router.replace('/(passenger)/home');
          break;
        case 'driver':
          router.replace('/(driver)/dashboard');
          break;
        case 'admin':
          // Future: router.replace('/(admin)/dashboard');
          router.replace('/(driver)/dashboard'); // Fallback to driver for now
          break;
        default:
          router.replace('/login');
      }
    }
  }, [isReady, auth.isAuthenticated, auth.user?.role]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0066cc" />
    </View>
  );
}