// extract-key-points: text → Gemini → ExtractionResult
// Body: { content: string }

import { corsHeaders } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import { callGeminiJson } from '../_shared/gemini.ts';
import { EXTRACTION_PROMPT } from '../_shared/prompts.ts';

interface ExtractRequest {
  content: string;
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
    const { content } = (await req.json()) as ExtractRequest;
    if (!content || typeof content !== 'string') {
      return jsonResponse({ error: 'content is required' }, 400);
    }

    const result = await callGeminiJson({
      systemPrompt: EXTRACTION_PROMPT,
      parts: [{ text: content }],
      maxOutputTokens: 2000,
    });

    return jsonResponse(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error';
    return jsonResponse({ error: message }, 500);
  }
});
