// app/(tabs)/passenger-profile/_layout.tsx
import { Stack } from 'expo-router';

export default function PassengerProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}