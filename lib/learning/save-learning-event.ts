import { getSupabase } from '../supabase-client';
import type { ExtractionResult } from '../types';

export async function saveLearningEvent(
  userId: string,
  sourceType: 'memo' | 'youtube' | 'pdf',
  extractionResult: ExtractionResult,
  sourceUrl?: string,
  rawText?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc('save_learning_event_atomic', {
    p_user_id: userId,
    p_source_type: sourceType,
    p_source_url: sourceUrl ?? null,
    p_title: extractionResult.title,
    p_summary: extractionResult.summary,
    p_raw_text: rawText ?? null,
    p_difficulty: extractionResult.difficulty,
    p_key_points: extractionResult.key_points,
    p_points_to_consume: sourceType === 'youtube' ? 2 : 1,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error ?? '保存に失敗しました' };
  }

  return { success: true };
}
