import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { extractKeyPoints } from '../../lib/ai-client';
import { useLearningStore } from '../../lib/stores/learning-store';

const MIN_CHARS = 100;

export default function MemoScreen() {
  const router = useRouter();
  const setResult = useLearningStore((s) => s.setResult);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = text.length >= MIN_CHARS && !loading;

  const handleExtract = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await extractKeyPoints(text);
      setResult(text, result);
      router.push('/learn/confirm');
    } catch (e) {
      setError(
        e instanceof Error
          ? `要点の抽出に失敗しました: ${e.message}`
          : 'しばらく待ってからもう一度お試しください',
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
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.input}
          placeholder="学んだことや気づきを書いてください..."
          placeholderTextColor="#64748b"
          multiline
          textAlignVertical="top"
          value={text}
          onChangeText={setText}
          editable={!loading}
        />
        <Text style={styles.charCount}>
          {text.length}文字{text.length < MIN_CHARS ? ` (あと${MIN_CHARS - text.length}文字)` : ''}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>AIが要点を抽出中...</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
  },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 200,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
  },
  charCount: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 8,
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: 36,
  },
  loadingContainer: {
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
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
