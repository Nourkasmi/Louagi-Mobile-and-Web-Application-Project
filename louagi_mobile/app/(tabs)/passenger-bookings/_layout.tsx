// app/(tabs)/passenger-bookings/_layout.tsx
import { Stack } from 'expo-router';

export default function PassengerBookingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}