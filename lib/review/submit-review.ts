import { scoreExplanation } from '../ai-client';
import { reviewCard, scoreToQuality } from '../srs-engine';
import { getSupabase } from '../supabase-client';
import { getKeyPointsForEvent } from '../supabase-client/queries';
import type { ScoringResult, SRSReviewResult, KeyPoint } from '../types';
import { POINT_COSTS, XP_REWARDS } from '../types';

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

    // 2. AI scoring (client-side — outside DB transaction)
    const scoringResult = await scoreExplanation(allKeyPoints, userAnswer);

    // 3. SRS calculation (client-side — outside DB transaction)
    const quality = scoreToQuality(scoringResult.score);
    const reviewResult = reviewCard(card, quality);

    // 4. Atomic DB update via RPC
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('submit_review_atomic', {
      p_user_id: userId,
      p_card_id: card.id,
      p_answer_mode: 'text',
      p_user_answer: userAnswer,
      p_score: scoringResult.score,
      p_covered_points: scoringResult.covered_points,
      p_missed_points: scoringResult.missed_points,
      p_inaccuracies: scoringResult.inaccuracies,
      p_feedback_message: scoringResult.feedback_message,
      p_follow_up_question: scoringResult.follow_up_question,
      p_srs_quality: scoringResult.srs_quality,
      p_xp_earned: XP_REWARDS.text_answer,
      p_points_to_consume: POINT_COSTS.text_answer,
      p_new_ef: reviewResult.new_easiness_factor,
      p_new_interval: reviewResult.new_interval,
      p_new_repetitions: reviewResult.new_repetitions,
      p_next_review_at: reviewResult.next_review_at,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as { success: boolean; error?: string };
    if (!result.success) {
      return { success: false, error: result.error ?? '採点に失敗しました' };
    }

    return { success: true, scoringResult, reviewResult };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : '採点に失敗しました',
    };
  }
}
