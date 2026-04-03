// Step 3b: 静的 Screen 定義を追加
// テスト対象: Screen 登録 → (tabs) レイアウト + auth 画面も読み込まれる
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
    </Stack>
  );
}
