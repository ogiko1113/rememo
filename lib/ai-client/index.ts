import type { ExtractionResult, ScoringResult, KeyPoint } from '../types';
import { EXTRACTION_PROMPT, SCORING_PROMPT } from './prompts';

// TODO: 蜍穂ｽ懃｢ｺ隱榊ｾ後↓ gemini-2.5-flash 縺ｸ縺ｮ遘ｻ陦後ｒ讀懆ｨ・
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

async function callGemini<T>(
  systemPrompt: string,
  userContent: string,
  maxOutputTokens = 8192,
): Promise<T> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('EXPO_PUBLIC_GEMINI_API_KEY is not set');
  }

  // TODO: 譛ｬ逡ｪ蜑阪↓Supabase Edge Function邨檎罰縺ｫ遘ｻ陦後＠縲、PI繧ｭ繝ｼ繧偵け繝ｩ繧､繧｢繝ｳ繝医°繧蛾勁蜴ｻ縺吶ｋ縺薙→
  const response = await fetch(
    `${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userContent }] }],
        generationConfig: { maxOutputTokens, temperature: 0.3, responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } },
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
  const context = `## 隕∫せ繝ｪ繧ｹ繝・n${JSON.stringify(keyPoints, null, 2)}\n\n## 繝ｦ繝ｼ繧ｶ繝ｼ縺ｮ隱ｬ譏蚕n${userExplanation}`;
  return callGemini<ScoringResult>(SCORING_PROMPT, context, 1500);
}

