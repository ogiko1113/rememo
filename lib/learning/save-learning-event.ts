import { getSupabase } from '../supabase-client';
import { createDefaultCard } from '../srs-engine';
import type { ExtractionResult } from '../types';

export async function saveLearningEvent(
  userId: string,
  sourceType: 'memo' | 'youtube' | 'pdf',
  extractionResult: ExtractionResult,
  sourceUrl?: string,
  rawText?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();

  // 1. learning_events に保存
  const { data: event, error: eventError } = await supabase
    .from('learning_events')
    .insert({
      user_id: userId,
      source_type: sourceType,
      source_url: sourceUrl ?? null,
      title: extractionResult.title,
      summary: extractionResult.summary,
      raw_text: rawText ?? null,
      difficulty: extractionResult.difficulty,
    })
    .select()
    .single();

  if (eventError || !event) {
    return { success: false, error: eventError?.message ?? '保存に失敗しました' };
  }

  // 2. learning_units に要点を保存
  const units = extractionResult.key_points.map((kp) => ({
    learning_event_id: event.id,
    key_point: kp,
  }));

  const { data: savedUnits, error: unitsError } = await supabase
    .from('learning_units')
    .insert(units)
    .select();

  if (unitsError || !savedUnits) {
    return { success: false, error: unitsError?.message ?? '要点の保存に失敗しました' };
  }

  // 3. 各学習ユニットに対してSRSカードを自動生成
  const cards = savedUnits.map((unit) => createDefaultCard(userId, unit.id));

  const { error: cardsError } = await supabase
    .from('srs_cards')
    .insert(cards);

  if (cardsError) {
    return { success: false, error: cardsError.message };
  }

  // 4. ポイント消費（メモ = 1pt）
  await supabase.rpc('consume_points', {
    p_user_id: userId,
    p_type: 'consume_memo',
    p_points: 1,
    p_metadata: { learning_event_id: event.id },
  });

  return { success: true };
}
