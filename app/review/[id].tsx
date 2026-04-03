import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/stores/auth-store';
import { getSupabase, getPointBalance } from '../../lib/supabase-client';
import { submitReview } from '../../lib/review/submit-review';
import type { ScoringResult, SRSReviewResult, KeyPoint } from '../../lib/types';
import ReviewFeedback from '../../components/ReviewFeedback';

interface CardData {
  id: string;
  user_id: string;
  easiness_factor: number;
  interval: number;
  repetitions: number;
  learning_units: {
    id: string;
    learning_event_id: string;
    key_point: KeyPoint;
    learning_events: {
      title: string;
    };
  };
}

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Feedback phase
  const [scoringResult, setScoringResult] = useState<ScoringResult | null>(null);
  const [reviewResult, setReviewResult] = useState<SRSReviewResult | null>(null);

  useEffect(() => {
    if (!id) return;
    getSupabase()
      .from('srs_cards')
      .select('*, learning_units(*, learning_events(*))')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('カードが見つかりませんでした');
        } else {
          setCard(data as CardData);
        }
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async () => {
    if (!user || !card || !answer.trim()) return;

    const balance = await getPointBalance(user.id);
    if (balance < 1) {
      Alert.alert('ポイント不足', 'ポイントが足りません。ポイントを追加してください。');
      return;
    }

    setSubmitting(true);
    setError('');

    const result = await submitReview(user.id, card, answer.trim());

    if (result.success && result.scoringResult && result.reviewResult) {
      setScoringResult(result.scoringResult);
      setReviewResult(result.reviewResult);
    } else {
      setError(result.error ?? '採点に失敗しました。もう一度お試しください。');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error && !card) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (scoringResult && reviewResult) {
    return (
      <ReviewFeedback
        scoringResult={scoringResult}
        reviewResult={reviewResult}
        onGoHome={() => router.replace('/(tabs)')}
      />
    );
  }

  const keyPoint = card?.learning_units?.key_point;
  const eventTitle = card?.learning_units?.learning_events?.title;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {eventTitle && (
          <Text style={styles.eventTitle}>{eventTitle}</Text>
        )}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            「{keyPoint?.content}」について説明してみて
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="ここに回答を入力..."
          placeholderTextColor="#64748b"
          multiline={true}
          textAlignVertical="top"
          value={answer}
          onChangeText={setAnswer}
          editable={!submitting}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        {submitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loadingText}>AIが採点中...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, !answer.trim() && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!answer.trim()}
          >
            <Text style={styles.primaryButtonText}>回答を送信</Text>
          </TouchableOpacity>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  scroll: {
    padding: 24,
    paddingBottom: 36,
  },
  eventTitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
  },
  questionCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 28,
  },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 160,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
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
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});
