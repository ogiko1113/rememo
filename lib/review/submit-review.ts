import { scoreExplanation } from '../ai-client';
import { reviewCard, scoreToQuality } from '../srs-engine';
import { getSupabase, updateSRSCard, consumePoints } from '../supabase-client';
import { getKeyPointsForEvent } from '../supabase-client/queries';
import type { ScoringResult, SRSReviewResult, KeyPoint } from '../types';
import { XP_REWARDS } from '../types';

interface CardWithRelations {
  id: string;
  user_id: string;
  easiness_factor: number;
  interval: number;
  repetitions: number;
  learning_units: {
    id: string;
    learning_event_id: string;
    key_point: KeyPoint;
  };
}

interface SubmitReviewResult {
  success: boolean;
  scoringResult?: ScoringResult;
  reviewResult?: SRSReviewResult;
  error?: string;
}

export async function submitReview(
  userId: string,
  card: CardWithRelations,
  userAnswer: string,
): Promise<SubmitReviewResult> {
  try {
    // 1. Get all key points for the learning event (for scoring context)
    const allKeyPoints = await getKeyPointsForEvent(card.learning_units.learning_event_id);
    if (allKeyPoints.length === 0) {
      return { success: false, error: '要点が見つかりませんでした' };
    }

    // 2. AI scoring
    const scoringResult = await scoreExplanation(allKeyPoints, userAnswer);

    // 3. SRS update
    const quality = scoreToQuality(scoringResult.score);
    const reviewResult = reviewCard(card, quality);

    // 4. Update SRS card in database
    await updateSRSCard(card.id, {
      easiness_factor: reviewResult.new_easiness_factor,
      interval: reviewResult.new_interval,
      repetitions: reviewResult.new_repetitions,
      next_review_at: reviewResult.next_review_at,
      last_reviewed_at: new Date().toISOString(),
    });

    const supabase = getSupabase();

    // 5. Save review session
    await supabase.from('review_sessions').insert({
      user_id: userId,
      srs_card_id: card.id,
      answer_mode: 'text',
      user_answer: userAnswer,
      score: scoringResult.score,
      covered_points: scoringResult.covered_points,
      missed_points: scoringResult.missed_points,
      inaccuracies: scoringResult.inaccuracies,
      feedback_message: scoringResult.feedback_message,
      follow_up_question: scoringResult.follow_up_question,
      srs_quality: scoringResult.srs_quality,
      xp_earned: XP_REWARDS.text_answer,
      points_consumed: 1,
    });

    // 6. Consume points
    await consumePoints(userId, 'consume_text_answer', 1, { srs_card_id: card.id });

    // 7. Add XP
    const { data: settings } = await supabase
      .from('user_settings')
      .select('total_xp')
      .eq('user_id', userId)
      .single();
    if (settings) {
      await supabase
        .from('user_settings')
        .update({
          total_xp: settings.total_xp + XP_REWARDS.text_answer,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    return { success: true, scoringResult, reviewResult };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : '採点に失敗しました',
    };
  }
}
