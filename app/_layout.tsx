import { useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase-client/config';
import { getUserSettings } from '../lib/supabase-client';
import { useAuthStore } from '../lib/stores/auth-store';
import { useUserStore } from '../lib/stores/user-store';

export default function RootLayout() {
  const { user, isLoading, setUser, setLoading } = useAuthStore();
  const { setSettings } = useUserStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  useEffect(() => {
    if (!user) {
      setSettings(null);
      return;
    }
    getUserSettings(user.id).then(({ data }) => {
      setSettings(data as import('../lib/types').UserSettings | null);
    });
  }, [user, setSettings]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
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
      <Stack.Screen
        name="review/[id]"
        options={{ headerShown: true, title: '復習', presentation: 'modal' }}
      />
      <Stack.Screen
        name="learn/memo"
        options={{ headerShown: true, title: 'メモを入力', headerStyle: { backgroundColor: '#1a1a2e' }, headerTintColor: '#fff' }}
      />
      <Stack.Screen
        name="learn/confirm"
        options={{ headerShown: true, title: '要点の確認', headerStyle: { backgroundColor: '#1a1a2e' }, headerTintColor: '#fff' }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
});
