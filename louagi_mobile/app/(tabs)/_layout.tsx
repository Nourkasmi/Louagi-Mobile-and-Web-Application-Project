// app/(tabs)/_layout.tsx - FIXED Role-based Navigation
import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RootState } from '@/src/store/store';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useSelector((state: RootState) => state.auth);

  // If no user, don't render anything (auth check handles this)
  if (!user) return null;

  const isPassenger = user.role === 'passenger';
  const isDriver = user.role === 'driver';
  const isAdmin = user.role === 'admin';

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
      {/* ===== PASSENGER TABS ===== */}
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
            name="passenger-bookings"
            options={{
              title: 'My Bookings',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="bell.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="passenger-profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="paperplane.fill" color={color} />
              ),
            }}
          />
        </>
      )}

      {/* ===== DRIVER TABS ===== */}
      {isDriver && (
        <>
          <Tabs.Screen
            name="driver"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="car.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="driver-trips"
            options={{
              title: 'My Trips',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="bell.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="driver-profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="paperplane.fill" color={color} />
              ),
            }}
          />
        </>
      )}

      {/* ===== ADMIN TABS ===== */}
      {isAdmin && (
        <>
          <Tabs.Screen
            name="admin"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="house.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="admin-management"
            options={{
              title: 'Management',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="car.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="admin-profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color }: { color: string }) => (
                <IconSymbol size={28} name="paperplane.fill" color={color} />
              ),
            }}
          />
        </>
      )}

      {/* ===== CONDITIONAL HIDDEN TABS ===== */}
      {/* Hide routes that don't match current user role */}
      
      {!isPassenger && (
        <>
          <Tabs.Screen name="passenger" options={{ href: null }} />
          <Tabs.Screen name="passenger-bookings" options={{ href: null }} />
          <Tabs.Screen name="passenger-profile" options={{ href: null }} />
        </>
      )}
      
      {!isDriver && (
        <>
          <Tabs.Screen name="driver" options={{ href: null }} />
          <Tabs.Screen name="driver-trips" options={{ href: null }} />
          <Tabs.Screen name="driver-profile" options={{ href: null }} />
        </>
      )}
      
      {!isAdmin && (
        <>
          <Tabs.Screen name="admin" options={{ href: null }} />
          <Tabs.Screen name="admin-management" options={{ href: null }} />
          <Tabs.Screen name="admin-profile" options={{ href: null }} />
        </>
      )}

      {/* Hide legacy routes for all users */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="trips" options={{ href: null }} />
    </Tabs>
  );
}