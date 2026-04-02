// SM-2 間隔反復アルゴリズム

import type { SRSCard, SRSReviewResult } from '../types';

const SM2_DEFAULTS = {
  INITIAL_EASINESS: 2.5,
  MIN_EASINESS: 1.3,
  FIRST_INTERVAL: 1,
  SECOND_INTERVAL: 6,
} as const;

export function reviewCard(
  card: Pick<SRSCard, 'id' | 'easiness_factor' | 'interval' | 'repetitions'>,
  quality: number,
): SRSReviewResult {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  const newEF = Math.max(
    SM2_DEFAULTS.MIN_EASINESS,
    card.easiness_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  let newInterval: number;
  let newRepetitions: number;

  if (q < 3) {
    newRepetitions = 0;
    newInterval = SM2_DEFAULTS.FIRST_INTERVAL;
  } else {
    newRepetitions = card.repetitions + 1;
    if (card.repetitions === 0) {
      newInterval = SM2_DEFAULTS.FIRST_INTERVAL;
    } else if (card.repetitions === 1) {
      newInterval = SM2_DEFAULTS.SECOND_INTERVAL;
    } else {
      newInterval = Math.round(card.interval * newEF);
    }
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

  return {
    card_id: card.id,
    quality: q,
    new_easiness_factor: Math.round(newEF * 100) / 100,
    new_interval: newInterval,
    new_repetitions: newRepetitions,
    next_review_at: nextReviewAt.toISOString(),
  };
}

export function createDefaultCard(
  userId: string,
  learningUnitId: string,
): Omit<SRSCard, 'id' | 'created_at'> {
  return {
    user_id: userId,
    learning_unit_id: learningUnitId,
    easiness_factor: SM2_DEFAULTS.INITIAL_EASINESS,
    interval: 0,
    repetitions: 0,
    next_review_at: new Date().toISOString(),
    last_reviewed_at: null,
  };
}

export function scoreToQuality(score: number): number {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 20) return 1;
  return 0;
}

export function getDueCardsFilter(): { column: string; value: string } {
  return { column: 'next_review_at', value: new Date().toISOString() };
}
