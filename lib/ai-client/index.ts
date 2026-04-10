// Thin client over the Gemini-backed Supabase Edge Functions.
// All Gemini API calls and credentials live server-side; this module only
// forwards parameters and parses the response.

import { FunctionsHttpError } from '@supabase/supabase-js';
import { getSupabase } from '../supabase-client';
import type { ExtractionResult, ScoringResult, KeyPoint } from '../types';

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().functions.invoke<T>(name, { body });

  if (error) {
    // For HTTP errors, try to surface the JSON error message from the response body.
    if (error instanceof FunctionsHttpError) {
      try {
        const errBody = await error.context.json();
        const message = typeof errBody?.error === 'string' ? errBody.error : error.message;
        throw new Error(`${name}: ${message}`);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.startsWith(`${name}: `)) throw parseErr;
        throw new Error(`${name}: ${error.message}`);
      }
    }
    throw new Error(`${name}: ${error.message}`);
  }

  if (data == null) {
    throw new Error(`${name}: empty response`);
  }
  return data;
}

export async function extractKeyPoints(content: string): Promise<ExtractionResult> {
  return invokeFunction<ExtractionResult>('extract-key-points', { content });
}

export async function extractKeyPointsFromYoutube(
  youtubeUrl: string,
): Promise<ExtractionResult> {
  return invokeFunction<ExtractionResult>('extract-youtube', { youtube_url: youtubeUrl });
}

export async function scoreExplanation(
  keyPoints: KeyPoint[],
  userExplanation: string,
): Promise<ScoringResult> {
  return invokeFunction<ScoringResult>('score-explanation', {
    key_points: keyPoints,
    user_explanation: userExplanation,
  });
}
