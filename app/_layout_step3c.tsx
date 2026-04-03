// Step 3c: review/[id] + presentation: 'modal' を追加 ⚠️ 容疑度高
// テスト対象: presentation: 'modal' が Native Stack で正しく処理されるか
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
    </Stack>
  );
}
