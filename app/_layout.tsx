import { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const { user, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="review/[id]" />
      <Stack.Screen name="learn/memo" />
      <Stack.Screen name="learn/confirm" />
    </Stack>
  );
}
