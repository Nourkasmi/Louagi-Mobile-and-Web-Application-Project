// app/(tabs)/driver-trips/_layout.tsx
import { Stack } from 'expo-router';

export default function DriverTripsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}