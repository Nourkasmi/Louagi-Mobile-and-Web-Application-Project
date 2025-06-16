// Update: app/(tabs)/_layout.tsx

import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Import RootState from your Redux store for type safety
import { RootState } from '@/src/store/store';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null; // Prevent rendering if user data is not yet loaded

  const isPassenger = user.role === 'passenger';
  const isDriver = user.role === 'driver';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      {isPassenger && (
        <>
          <Tabs.Screen
            name="passenger"
            options={{
              title: 'Home',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="house.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Explore',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="paperplane.fill" color={color} />
              ),
            }}
          />
        </>
      )}

      {isDriver && (
        <>
          <Tabs.Screen
            name="driver"
            options={{
              title: 'Home',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="car.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="requests"
            options={{
              title: 'Requests',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="bell.fill" color={color} />
              ),
            }}
          />
        </>
      )}
    </Tabs>
  );
}