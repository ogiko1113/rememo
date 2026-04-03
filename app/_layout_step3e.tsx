// Step 3e: 条件付きレンダリング（Supabase/Zustand なしでハードコード）
// テスト対象: {user ? ... : ...} パターンが Stack children で問題を起こすか
import { Stack } from 'expo-router';

export default function RootLayout() {
  const user = null; // テスト用ハードコード

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="(tabs)" />
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
        </>
      ) : (
        <Stack.Screen name="auth" />
      )}
    </Stack>
  );
}
