import { getSupabase } from './index';
import type { KeyPoint } from '../types';

export async function getKeyPointsForEvent(learningEventId: string): Promise<KeyPoint[]> {
  const { data, error } = await getSupabase()
    .from('learning_units')
    .select('key_point')
    .eq('learning_event_id', learningEventId);

  if (error || !data) return [];
  return data.map((row) => row.key_point as KeyPoint);
}
