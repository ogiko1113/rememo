import type { ExtractionResult, ScoringResult, KeyPoint } from '../types';
import { EXTRACTION_PROMPT, SCORING_PROMPT } from './prompts';

// TODO: 動作確認後に gemini-2.5-flash への移行を検討
const GEMINI_MODEL = 'gemini-2.0-flash-001';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGemini<T>(
  systemPrompt: string,
  userContent: string,
  maxOutputTokens = 1000,
): Promise<T> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set');
  }

  // TODO: 本番前にSupabase Edge Function経由に移行し、APIキーをクライアントから除去すること
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

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  console.log('[Gemini] raw response:', JSON.stringify(data, null, 2));

  const candidates = data.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error(`Gemini returned no candidates: ${JSON.stringify(data)}`);
  }

  const text = candidates[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini returned empty text: ${JSON.stringify(candidates[0])}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${text.slice(0, 500)}`);
  }
}

export async function extractKeyPoints(content: string): Promise<ExtractionResult> {
  return callGemini<ExtractionResult>(EXTRACTION_PROMPT, content, 2000);
}

export async function scoreExplanation(keyPoints: KeyPoint[], userExplanation: string): Promise<ScoringResult> {
  const context = `## 要点リスト\n${JSON.stringify(keyPoints, null, 2)}\n\n## ユーザーの説明\n${userExplanation}`;
  return callGemini<ScoringResult>(SCORING_PROMPT, context, 1500);
}
