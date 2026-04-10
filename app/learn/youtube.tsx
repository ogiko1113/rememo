import { useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { extractKeyPointsFromYoutube } from '../../lib/ai-client';
import { useLearningStore } from '../../lib/stores/learning-store';

function parseYoutubeVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function YoutubeScreen() {
  const router = useRouter();
  const setResult = useLearningStore((s) => s.setResult);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const videoId = parseYoutubeVideoId(url);
  const canSubmit = videoId !== null && !loading;

  const handleExtract = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await extractKeyPointsFromYoutube(url.trim());
      setResult('', result, 'youtube', url.trim());
      router.push('/learn/confirm');
    } catch (e) {
      setError(
        e instanceof Error
          ? `要点の抽出に失敗しました: ${e.message}`
          : '動画の取得に失敗しました。公開動画であることを確認してください。',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.input}
          placeholder="YouTube URLを貼り付け"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          value={url}
          onChangeText={setUrl}
          editable={!loading}
        />

        <Text style={styles.note}>
          ※ 公開動画のみ対応（限定公開・非公開は不可）
        </Text>

        {videoId ? (
          <Image
            source={{ uri: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>
              抽出中...（動画の長さによって1〜2分かかります）
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleExtract}
            disabled={!canSubmit}
          >
            <Text style={styles.buttonText}>AIで要点を抽出する</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: '#1a1a2e' },
  scroll: { flexGrow: 1, padding: 24 },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  note: { color: '#64748b', fontSize: 13, marginTop: 12 },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    marginTop: 16,
  },
  error: { color: '#ef4444', fontSize: 14, marginTop: 16, textAlign: 'center' },
  footer: { padding: 24, paddingBottom: 36 },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    gap: 8,
  },
  loadingText: { color: '#94a3b8', fontSize: 14, flexShrink: 1 },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
