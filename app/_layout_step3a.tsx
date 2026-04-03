// Step 3a: Stack ナビゲータのみ（画面定義なし）
// テスト対象: expo-router の Stack + headerShown: false (boolean prop)
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
