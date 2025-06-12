import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { ActivityIndicator, View } from 'react-native';

// Import RootState type from your store
import { RootState } from '../src/store/store';

export default function Index() {
  const auth = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay to let the router and layout mount first
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 100); // Wait just 100ms

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isReady) {
      if (auth.isAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isReady, auth.isAuthenticated]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
