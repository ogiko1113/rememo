// Re:Memo 共通型定義

export type PlanId = 'free' | 'lite' | 'pro' | 'master';

export interface UserSettings {
  user_id: string;
  plan: PlanId;
  point_balance: number;
  streak_count: number;
  total_xp: number;
  notification_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanFeatures {
  voice_answer: boolean;
  weakness: boolean;
  oral_exam: boolean;
  offline: boolean;
  ad_free: boolean;
}

export interface PointPlan {
  id: PlanId;
  monthly_points: number;
  price_monthly: number;
  price_yearly: number;
  ad_reward_enabled: boolean;
  ad_reward_per_view: number;
  ad_max_views_per_day: number;
  features: PlanFeatures;
}

export type SourceType = 'memo' | 'youtube' | 'pdf' | 'recording';

export interface LearningEvent {
  id: string;
  user_id: string;
  source_type: SourceType;
  source_url: string | null;
  title: string;
  summary: string;
  raw_text: string | null;
  difficulty: number;
  created_at: string;
}

export type KeyPointType = 'definition' | 'comparison' | 'causation' | 'procedure' | 'exception' | 'application';

export interface KeyPoint {
  type: KeyPointType;
  content: string;
  importance: number;
  keywords: string[];
}

export interface LearningUnit {
  id: string;
  learning_event_id: string;
  key_point: KeyPoint;
  source_id: string | null;
  created_at: string;
}

export interface SRSCard {
  id: string;
  user_id: string;
  learning_unit_id: string;
  easiness_factor: number;
  interval: number;
  repetitions: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  created_at: string;
}

export interface SRSReviewResult {
  card_id: string;
  quality: number;
  new_easiness_factor: number;
  new_interval: number;
  new_repetitions: number;
  next_review_at: string;
}

export type AnswerMode = 'voice' | 'text';

export interface ReviewSession {
  id: string;
  user_id: string;
  srs_card_id: string;
  answer_mode: AnswerMode;
  user_answer: string;
  score: number;
  covered_points: string[];
  missed_points: string[];
  inaccuracies: string[];
  feedback_message: string;
  follow_up_question: string | null;
  srs_quality: number;
  xp_earned: number;
  points_consumed: number;
  audio_duration_seconds: number | null;
  created_at: string;
}

export type PointTransactionType =
  | 'monthly_grant' | 'ad_reward' | 'purchase'
  | 'consume_memo' | 'consume_youtube' | 'consume_pdf'
  | 'consume_text_answer' | 'consume_voice_answer'
  | 'consume_weakness' | 'consume_oral_exam' | 'consume_recording'
  | 'expire';

export interface PointTransaction {
  id: string;
  user_id: string;
  type: PointTransactionType;
  amount: number;
  balance_after: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ExtractionResult {
  title: string;
  key_points: KeyPoint[];
  summary: string;
  difficulty: number;
}

export interface ScoringResult {
  score: number;
  covered_points: string[];
  missed_points: string[];
  inaccuracies: string[];
  ambiguous_points: string[];
  feedback_message: string;
  follow_up_question: string | null;
  srs_quality: number;
}

export const POINT_COSTS = {
  memo: 1,
  youtube_10min: 2,
  youtube_30min: 4,
  youtube_60min: 6,
  youtube_120min: 10,
  youtube_over_120min: 15,
  pdf_1page: 1,
  pdf_5pages: 3,
  text_answer: 1,
  voice_answer: 1,
  weakness: 2,
  oral_exam: 8,
  recording_30min: 12,
} as const;

export const XP_REWARDS = {
  voice_answer: 20,
  text_answer: 10,
} as const;

export function calculateYoutubePoints(durationMinutes: number): number {
  if (durationMinutes <= 10) return POINT_COSTS.youtube_10min;
  if (durationMinutes <= 30) return POINT_COSTS.youtube_30min;
  if (durationMinutes <= 60) return POINT_COSTS.youtube_60min;
  if (durationMinutes <= 120) return POINT_COSTS.youtube_120min;
  return POINT_COSTS.youtube_over_120min;
}
