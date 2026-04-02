import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="review/[id]" options={{ headerShown: true, title: '復習', presentation: 'modal' }} />
    </Stack>
  );
}
