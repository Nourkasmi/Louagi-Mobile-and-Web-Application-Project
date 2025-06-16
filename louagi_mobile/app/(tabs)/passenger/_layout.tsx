import { Stack } from 'expo-router';

export default function PassengerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="search" />
      <Stack.Screen name="booking" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
