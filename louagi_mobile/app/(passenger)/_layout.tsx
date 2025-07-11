// app/(passenger)/_layout.tsx - ENHANCED Passenger Tab Layout with Better UX
import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, Text } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Enhanced tab bar icon component using your IconSymbol
const TabBarIcon = ({ name, color, focused }: {
  name: any; // IconSymbol name type
  color: string;
  focused: boolean;
}) => (
  <View style={{
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    transform: [{ scale: focused ? 1.1 : 1.0 }],
  }}>
    <IconSymbol
      name={name}
      size={focused ? 28 : 26}
      color={color}
      weight={focused ? 'semibold' : 'regular'}
    />
  </View>
);

// Enhanced tab bar label component
const TabBarLabel = ({ children, color, focused }: {
  children: string;
  color: string;
  focused: boolean;
}) => (
  <Text
    style={{
      fontSize: focused ? 12 : 11,
      fontWeight: focused ? '600' : '500',
      color,
      marginTop: Platform.OS === 'ios' ? -2 : 2,
      textAlign: 'center',
    }}
  >
    {children}
  </Text>
);

export default function PassengerLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0066cc', // Your brand color
        tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#2c2c2e' : '#e5e5ea',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 34 : 8,
          paddingTop: 8,
          paddingHorizontal: 8,
          ...Platform.select({
            ios: {
              position: 'absolute',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
            },
            android: {
              elevation: 8,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            },
          }),
        },
        tabBarItemStyle: {
          paddingVertical: 4,
          borderRadius: 12,
          marginHorizontal: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      {/* HOME TAB */}
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="house.fill" color={color} focused={focused} />
          ),
          tabBarLabel: ({ color, focused, children }) => (
            <TabBarLabel color={color} focused={focused}>{children}</TabBarLabel>
          ),
          tabBarAccessibilityLabel: 'Home tab',
          tabBarTestID: 'home-tab',
        }}
      />

      {/* MY BOOKINGS TAB */}
      <Tabs.Screen
        name="bookings/index"
        options={{
          title: 'My Trips',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="calendar" color={color} focused={focused} />
          ),
          tabBarLabel: ({ color, focused, children }) => (
            <TabBarLabel color={color} focused={focused}>{children}</TabBarLabel>
          ),
          tabBarAccessibilityLabel: 'My trips tab',
          tabBarTestID: 'bookings-tab',
          tabBarBadge: undefined, // Can be dynamically set based on pending bookings
        }}
      />

      {/* PROFILE TAB */}
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="person.crop.circle" color={color} focused={focused} />
          ),
          tabBarLabel: ({ color, focused, children }) => (
            <TabBarLabel color={color} focused={focused}>{children}</TabBarLabel>
          ),
          tabBarAccessibilityLabel: 'Profile tab',
          tabBarTestID: 'profile-tab',
        }}
      />

      {/* Hide screens that shouldn't show as tabs */}
      <Tabs.Screen
        name="booking"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }
        }}
      />

      <Tabs.Screen
        name="payment"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }
        }}
      />

      <Tabs.Screen
        name="bookings/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }
        }}
      />

      <Tabs.Screen
        name="search/index"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }
        }}
      />

      <Tabs.Screen
        name="profile/edit"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }
        }}
      />

      {/* Hide component and utility folders */}
      <Tabs.Screen name="bookings/components" options={{ href: null }} />
      <Tabs.Screen name="bookings/types" options={{ href: null }} />
      <Tabs.Screen name="bookings/utils" options={{ href: null }} />
    </Tabs>
  );
}