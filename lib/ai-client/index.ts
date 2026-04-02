import type { ExtractionResult, ScoringResult, KeyPoint } from '../types';
import { EXTRACTION_PROMPT, SCORING_PROMPT } from './prompts';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiConfig { apiKey: string; }
let config: GeminiConfig | null = null;

export function initGemini(apiKey: string): void { config = { apiKey }; }

async function callGemini<T>(systemPrompt: string, userContent: string, maxOutputTokens = 1000): Promise<T> {
  if (!config) throw new Error('Gemini not initialized. Call initGemini() first.');
  const response = await fetch(
    `${GEMINI_ENDPOINT}/${GEMINI_MODEL}:generateContent?key=${config.apiKey}`,
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

export async function extractKeyPoints(content: string): Promise<ExtractionResult> {
  return callGemini<ExtractionResult>(EXTRACTION_PROMPT, content, 2000);
}

export async function scoreExplanation(keyPoints: KeyPoint[], userExplanation: string): Promise<ScoringResult> {
  const context = `## 要点リスト\n${JSON.stringify(keyPoints, null, 2)}\n\n## ユーザーの説明\n${userExplanation}`;
  return callGemini<ScoringResult>(SCORING_PROMPT, context, 1500);
}
