// app/(passenger)/_layout.tsx 
import { Stack } from 'expo-router';

export default function PassengerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="home/index" />
      <Stack.Screen name="bookings/index" />
      <Stack.Screen name="bookings/[id]" />
      <Stack.Screen name="profile/index" />
      <Stack.Screen name="profile/edit" />
      <Stack.Screen name="booking/index" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="search/index" />
      <Stack.Screen name="search/trips" />
    </Stack>
  );
}