// app/(driver)/_layout.tsx 

import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function DriverLayout() {
  const colorScheme = useColorScheme();

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
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips/index"
        options={{
          title: 'My Trips',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="car.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="earnings/index"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bell.fill" color={color} />
          ),
        }}
      />
      {/*  Hide Declare Availability tab from bottom navigation */}
      <Tabs.Screen
        name="declare-availability/index"
        options={{
          href: null, // This hides the tab from the bottom navigation
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
      {/* Add edit profile route (hidden from tabs) */}
      <Tabs.Screen
        name="profile/edit"
        options={{
          href: null, // Hidden from tab bar, accessible via navigation
        }}
      />
    </Tabs>
  );
}