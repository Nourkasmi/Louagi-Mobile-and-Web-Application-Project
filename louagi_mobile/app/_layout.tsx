// app/(tabs)/_layout.tsx - Updated with All Screens
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
            name="passenger/HomeScreen"
            options={{
              title: 'Search',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="house.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="passenger/BookingHistoryScreen"
            options={{
              title: 'Bookings',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="paperplane.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="passenger/ProfileScreen"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="chevron.left.forwardslash.chevron.right" color={color} />
              ),
            }}
          />
          {/* Hidden screens that don't appear in tabs */}
          <Tabs.Screen
            name="passenger/SearchScreen"
            options={{
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="passenger/BookingScreen"
            options={{
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="passenger/PaymentScreen"
            options={{
              href: null, // Hide from tab bar
            }}
          />
        </>
      )}

      {isDriver && (
        <>
          <Tabs.Screen
            name="driver/home"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="house.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="driver/TripHistoryScreen"
            options={{
              title: 'Trips',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="paperplane.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="driver/EarningsScreen"
            options={{
              title: 'Earnings',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="chevron.left.forwardslash.chevron.right" color={color} />
              ),
            }}
          />
          {/* Hidden driver screens */}
          <Tabs.Screen
            name="driver/requests"
            options={{
              href: null, // Hide from tab bar - keeping for compatibility
            }}
          />
        </>
      )}
    </Tabs>
  );
}