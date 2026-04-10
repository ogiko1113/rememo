// Server-side Gemini API client. GEMINI_API_KEY must be set in Supabase secrets:
//   supabase secrets set GEMINI_API_KEY=...
// Never expose this key to the client.

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export type GeminiPart =
  | { text: string }
  | { file_data: { file_uri: string; mime_type?: string } };

export interface CallGeminiOptions {
  systemPrompt: string;
  parts: GeminiPart[];
  maxOutputTokens?: number;
}

export async function callGeminiJson<T>({
  systemPrompt,
  parts,
  maxOutputTokens = 1500,
}: CallGeminiOptions): Promise<T> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in Edge Function secrets');
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts }],
      generationConfig: {
        maxOutputTokens,
        temperature: 0.3,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText.slice(0, 500)}`);
  }

  const data = await response.json();
  const candidates = data.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error(`Gemini returned no candidates: ${JSON.stringify(data).slice(0, 500)}`);
  }

  const text = candidates[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Gemini returned empty text: ${JSON.stringify(candidates[0]).slice(0, 500)}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Failed to parse Gemini response as JSON: ${text.slice(0, 500)}`);
  }
}
