// extract-youtube: YouTube URL → Gemini (file_data) → ExtractionResult
// Body: { youtube_url: string }
// Note: Gemini natively supports YouTube URLs via file_data.file_uri,
// so no transcript fetching is required here.

import { corsHeaders } from '../_shared/cors.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import { callGeminiJson } from '../_shared/gemini.ts';
import { EXTRACTION_PROMPT } from '../_shared/prompts.ts';

interface YoutubeRequest {
  youtube_url: string;
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
    const { youtube_url } = (await req.json()) as YoutubeRequest;
    if (!youtube_url || typeof youtube_url !== 'string') {
      return jsonResponse({ error: 'youtube_url is required' }, 400);
    }

    const result = await callGeminiJson({
      systemPrompt: EXTRACTION_PROMPT,
      parts: [
        { text: 'この動画の内容から学習すべき要点を抽出してください。' },
        { file_data: { file_uri: youtube_url } },
      ],
      maxOutputTokens: 8192,
    });

    return jsonResponse(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error';
    return jsonResponse({ error: message }, 500);
  }
});
