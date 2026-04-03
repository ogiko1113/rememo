import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import type { ScoringResult, SRSReviewResult } from '../lib/types';
import { XP_REWARDS } from '../lib/types';

function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 75) return '#6366f1';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return '完璧！';
  if (score >= 75) return 'よくできました';
  if (score >= 60) return 'もう少し';
  return '復習しましょう';
}

interface Props {
  scoringResult: ScoringResult;
  reviewResult: SRSReviewResult;
  onGoHome: () => void;
}

export default function ReviewFeedback({ scoringResult, reviewResult, onGoHome }: Props) {
  const scoreColor = getScoreColor(scoringResult.score);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.scoreSection}>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>
          {scoringResult.score}点
        </Text>
        <Text style={[styles.scoreLabel, { color: scoreColor }]}>
          {getScoreLabel(scoringResult.score)}
        </Text>
        <Text style={styles.xpBadge}>+{XP_REWARDS.text_answer} XP</Text>
      </View>

      {scoringResult.covered_points.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ 触れた要点</Text>
          {scoringResult.covered_points.map((point, i) => (
            <Text key={i} style={styles.pointGood}>・{point}</Text>
          ))}
        </View>
      )}

      {scoringResult.missed_points.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ 抜けていた要点</Text>
          {scoringResult.missed_points.map((point, i) => (
            <Text key={i} style={styles.pointMissed}>・{point}</Text>
          ))}
        </View>
      )}

      {scoringResult.inaccuracies.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❌ 不正確な点</Text>
          {scoringResult.inaccuracies.map((point, i) => (
            <Text key={i} style={styles.pointError}>・{point}</Text>
          ))}
        </View>
      )}

      <View style={styles.feedbackCard}>
        <Text style={styles.feedbackLabel}>💬 フィードバック</Text>
        <Text style={styles.feedbackText}>{scoringResult.feedback_message}</Text>
      </View>

      <View style={styles.nextReviewCard}>
        <Text style={styles.nextReviewLabel}>📅 次回復習</Text>
        <Text style={styles.nextReviewValue}>{reviewResult.new_interval}日後</Text>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={onGoHome}>
        <Text style={styles.primaryButtonText}>ホームに戻る</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scroll: {
    padding: 24,
    paddingBottom: 36,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  xpBadge: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
    marginTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  pointGood: {
    fontSize: 14,
    color: '#22c55e',
    lineHeight: 22,
    marginLeft: 4,
  },
  pointMissed: {
    fontSize: 14,
    color: '#f59e0b',
    lineHeight: 22,
    marginLeft: 4,
  },
  pointError: {
    fontSize: 14,
    color: '#ef4444',
    lineHeight: 22,
    marginLeft: 4,
  },
  feedbackCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 24,
  },
  nextReviewCard: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextReviewLabel: {
    fontSize: 14,
    color: '#94a3b8',
  },
  nextReviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
