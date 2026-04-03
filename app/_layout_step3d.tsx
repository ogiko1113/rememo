// Step 3d: learn 画面 + headerStyle を追加
// テスト対象: headerStyle, headerTintColor オプション
import { Stack } from 'expo-router';

export default function RootLayout() {
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
