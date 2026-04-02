import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../lib/stores/auth-store';
import { useUserStore } from '../../lib/stores/user-store';
import { getDueCards, getUserSettings } from '../../lib/supabase-client';
import type { UserSettings } from '../../lib/types';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const settings = useUserStore((s) => s.settings);
  const setSettings = useUserStore((s) => s.setSettings);
  const [dueCount, setDueCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getDueCards(user.id).then(({ data }) => {
        setDueCount(data?.length ?? 0);
      });
      getUserSettings(user.id).then(({ data }) => {
        if (data) setSettings(data as UserSettings);
      });
    }, [user, setSettings]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>おかえりなさい</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>今日の復習</Text>
          {dueCount === 0 ? (
            <Text style={styles.cardEmpty}>今日の復習はありません 🎉</Text>
          ) : (
            <>
              <Text style={styles.cardCount}>{dueCount}件</Text>
              <TouchableOpacity style={styles.reviewButton}>
                <Text style={styles.reviewButtonText}>復習を始める</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{settings?.streak_count ?? 0}</Text>
            <Text style={styles.statLabel}>ストリーク</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{settings?.total_xp ?? 0}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
  },
  email: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 24,
    marginTop: 32,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  cardEmpty: {
    fontSize: 16,
    color: '#94a3b8',
  },
  cardCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  reviewButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 32,
  },
  reviewButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
});
