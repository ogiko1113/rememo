import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native';
import { useAuthStore } from '../../lib/stores/auth-store';
import { useUserStore } from '../../lib/stores/user-store';
import { signOut } from '../../lib/supabase-client';

const planLabels: Record<string, string> = {
  free: 'Free',
  lite: 'Lite',
  pro: 'Pro',
  master: 'Master',
};

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const settings = useUserStore((s) => s.settings);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      Alert.alert('エラー', 'ログアウトに失敗しました');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>設定</Text>

        <Text style={styles.sectionTitle}>アカウント</Text>
        <View style={styles.card}>
          <Row label="メール" value={user?.email ?? '-'} />
          <Row label="プラン" value={planLabels[settings?.plan ?? 'free'] ?? 'Free'} />
          <Row label="ポイント残高" value={`${settings?.point_balance ?? 0}pt`} />
        </View>

        <Text style={styles.sectionTitle}>復習設定</Text>
        <View style={styles.card}>
          <Row label="通知時間" value={settings?.notification_time ?? '未設定'} />
        </View>

        <Text style={styles.sectionTitle}>その他</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleSignOut}>
            <Text style={styles.logoutText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scroll: {
    padding: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomColor: '#1a1a2e',
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontSize: 16,
    color: '#ffffff',
  },
  rowValue: {
    fontSize: 16,
    color: '#94a3b8',
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: '600',
  },
});
