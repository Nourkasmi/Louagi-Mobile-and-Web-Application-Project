import { Stack } from 'expo-router';

export default function DriverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="requests" />
      <Stack.Screen name="trips" />
      <Stack.Screen name="earnings" />
    </Stack>
  );
}
