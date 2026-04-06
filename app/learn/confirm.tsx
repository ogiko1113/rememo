import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/stores/auth-store';
import { useUserStore } from '../../lib/stores/user-store';
import { useLearningStore } from '../../lib/stores/learning-store';
import { extractKeyPoints, extractKeyPointsFromYoutube } from '../../lib/ai-client';
import { getUserSettings } from '../../lib/supabase-client';
import { saveLearningEvent } from '../../lib/learning/save-learning-event';
import type { KeyPoint } from '../../lib/types';
import KeyPointCard from '../../components/KeyPointCard';

export default function ConfirmScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setSettings = useUserStore((s) => s.setSettings);
  const { rawText, extractionResult, sourceType, sourceUrl, updateResult, clear } = useLearningStore();

  const [title, setTitle] = useState(extractionResult?.title ?? '');
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>(
    extractionResult?.key_points ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);

  if (!extractionResult) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>データがありません。戻ってください。</Text>
      </View>
    );
  }

  const handleDelete = (index: number) => {
    setKeyPoints((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user || keyPoints.length === 0) return;
    setSaving(true);
    try {
      const result = await saveLearningEvent(user.id, sourceType, {
        ...extractionResult,
        title,
        key_points: keyPoints,
      }, sourceUrl ?? undefined, rawText || undefined);

      if (result.success) {
        clear();
        const { data } = await getUserSettings(user.id);
        if (data) {
          setSettings(data as import('../../lib/types').UserSettings);
        }
        Alert.alert('保存しました！', '要点がSRSカードとして登録されました。', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        Alert.alert('エラー', result.error ?? '保存に失敗しました');
      }
    } catch {
      Alert.alert('エラー', '保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const result = sourceType === 'youtube' && sourceUrl
        ? await extractKeyPointsFromYoutube(sourceUrl)
        : await extractKeyPoints(rawText);
      updateResult(result);
      setTitle(result.title);
      setKeyPoints(result.key_points);
    } catch {
      Alert.alert('エラー', 'やり直しに失敗しました。');
    } finally {
      setRetrying(false);
    }
  };

  const isLoading = saving || retrying;

  return (
    <View style={styles.container}>
      <FlatList
        data={keyPoints}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <KeyPointCard item={item} index={index} onDelete={handleDelete} />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="タイトル"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.summary}>{extractionResult.summary}</Text>
            <Text style={styles.sectionLabel}>
              要点（{keyPoints.length}件）
            </Text>
          </>
        }
      />

      <View style={styles.footer}>
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>
              {saving ? '保存中...' : '再抽出中...'}
            </Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.saveButton, keyPoints.length === 0 && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={keyPoints.length === 0}
            >
              <Text style={styles.saveButtonText}>この内容で保存する</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>やり直す</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 48,
  },
  list: {
    padding: 24,
    paddingBottom: 8,
  },
  titleInput: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summary: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  footer: {
    padding: 24,
    paddingBottom: 36,
  },
  loadingRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    gap: 8,
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
