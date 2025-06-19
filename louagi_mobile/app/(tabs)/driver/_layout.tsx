// app/(tabs)/driver/_layout.tsx - Driver Layout with Profile
import { Stack } from 'expo-router';

export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="trips" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="TripHistoryScreen" />
      <Stack.Screen name="availability" />
    </Stack>
  );
}