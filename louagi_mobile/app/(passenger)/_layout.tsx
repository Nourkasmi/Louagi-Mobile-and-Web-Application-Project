// app/(passenger)/_layout.tsx - FINAL BEAUTIFUL VERSION
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Color scheme
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#8e8e93',

        // ENHANCED STYLING
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0.5,
          borderTopColor: '#c6c6c8',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
          paddingHorizontal: 16,

          // Modern shadows
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,

          // Rounded corners (modern look)
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },

        // Label styling
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: 2,
        },

        // Icon styling
        tabBarIconStyle: {
          marginTop: 2,
        },

        // Item styling
        tabBarItemStyle: {
          paddingVertical: 4,
          borderRadius: 12,
          marginHorizontal: 4,
        },

        // Remove headers
        headerShown: false,

        // Smooth animations
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? 'home' : 'home'}
              size={focused ? 26 : 24}
              color={color}
              style={{
                opacity: focused ? 1 : 0.8,
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings/index"
        options={{
          title: 'My Trips',
          tabBarLabel: 'My Trips',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? 'history' : 'history'}
              size={focused ? 26 : 24}
              color={color}
              style={{
                opacity: focused ? 1 : 0.8,
              }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? 'person' : 'person-outline'}
              size={focused ? 26 : 24}
              color={color}
              style={{
                opacity: focused ? 1 : 0.8,
              }}
            />
          ),
        }}
      />

      {/* Hidden screens */}
      <Tabs.Screen name="booking" options={{ href: null }} />
      <Tabs.Screen name="payment" options={{ href: null }} />
      <Tabs.Screen name="bookings/[id]" options={{ href: null }} />
      <Tabs.Screen name="search/index" options={{ href: null }} />
      <Tabs.Screen name="search/trips" options={{ href: null }} />
      <Tabs.Screen name="profile/edit" options={{ href: null }} />
      <Tabs.Screen name="bookings/components" options={{ href: null }} />
      <Tabs.Screen name="bookings/types" options={{ href: null }} />
      <Tabs.Screen name="bookings/utils" options={{ href: null }} />
    </Tabs>
  );
}