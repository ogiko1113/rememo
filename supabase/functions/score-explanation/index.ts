// score-explanation: user answer + key points → Gemini → ScoringResult
// Body: { key_points: KeyPoint[], user_explanation: string }

import { corsHeaders } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import { callGeminiJson } from '../_shared/gemini.ts';
import { SCORING_PROMPT } from '../_shared/prompts.ts';

interface ScoreRequest {
  key_points: unknown[];
  user_explanation: string;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const userId = await authenticateRequest(req);
  if (!userId) return jsonResponse({ error: 'Unauthorized' }, 401);

  try {
    const { key_points, user_explanation } = (await req.json()) as ScoreRequest;
    if (!Array.isArray(key_points) || typeof user_explanation !== 'string') {
      return jsonResponse(
        { error: 'key_points (array) and user_explanation (string) are required' },
        400,
      );
    }

    const context =
      `## 要点リスト\n${JSON.stringify(key_points, null, 2)}\n\n## ユーザーの説明\n${user_explanation}`;

    const result = await callGeminiJson({
      systemPrompt: SCORING_PROMPT,
      parts: [{ text: context }],
      maxOutputTokens: 1500,
    });

    return jsonResponse(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error';
    return jsonResponse({ error: message }, 500);
  }
});
