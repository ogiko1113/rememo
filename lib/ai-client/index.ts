import type { ExtractionResult, ScoringResult, KeyPoint } from '../types';
import { EXTRACTION_PROMPT, SCORING_PROMPT } from './prompts';
import { getSupabase } from '../supabase-client';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGeminiViaEdgeFunction<T>(
  systemPrompt: string,
  userContent: string,
  maxOutputTokens = 1000,
): Promise<T> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke('gemini-proxy', {
    body: { systemPrompt, userContent, maxOutputTokens },
  });

  if (error) throw new Error(`Edge Function error: ${error.message}`);
  if (!data) throw new Error('Empty response from Edge Function');
  return data as T;
}

// TODO: 本番前にEdge Function経由に完全移行。この暫定コードを削除すること
async function callGeminiFallback<T>(
  apiKey: string,
  systemPrompt: string,
  userContent: string,
  maxOutputTokens = 1000,
): Promise<T> {
  const response = await fetch(
    `${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userContent }] }],
        generationConfig: { maxOutputTokens, temperature: 0.3, responseMimeType: 'application/json' },
      }),
    },
  );
  if (!response.ok) throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return JSON.parse(text) as T;
}

async function callGemini<T>(
  systemPrompt: string,
  userContent: string,
  maxOutputTokens = 1000,
): Promise<T> {
  try {
    return await callGeminiViaEdgeFunction<T>(systemPrompt, userContent, maxOutputTokens);
  } catch {
    // TODO: 本番前にEdge Function経由に完全移行。この暫定コードを削除すること
    const fallbackKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (fallbackKey) {
      return callGeminiFallback<T>(fallbackKey, systemPrompt, userContent, maxOutputTokens);
    }
    throw new Error('Gemini API is not available. Edge Function not deployed and no fallback key.');
  }
}

export async function extractKeyPoints(content: string): Promise<ExtractionResult> {
  return callGemini<ExtractionResult>(EXTRACTION_PROMPT, content, 2000);
}

export async function scoreExplanation(keyPoints: KeyPoint[], userExplanation: string): Promise<ScoringResult> {
  const context = `## 要点リスト\n${JSON.stringify(keyPoints, null, 2)}\n\n## ユーザーの説明\n${userExplanation}`;
  return callGemini<ScoringResult>(SCORING_PROMPT, context, 1500);
}
