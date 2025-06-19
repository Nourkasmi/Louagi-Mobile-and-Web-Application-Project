// app/(tabs)/driver-profile/_layout.tsx
import { Stack } from 'expo-router';

export default function DriverProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}