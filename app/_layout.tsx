import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ActivityIndicator, View } from 'react-native';

export default function RootLayout() {
  const { user, isLoading, initialize } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!user && !inAuthGroup) {
      router.replace('/auth');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, isLoading, router, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="review/[id]" />
      <Stack.Screen name="learn/memo" />
      <Stack.Screen name="learn/youtube" />
      <Stack.Screen name="learn/confirm" />
    </Stack>
  );
}
