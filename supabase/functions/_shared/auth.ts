// Verifies the caller's Supabase JWT and returns the authenticated user id.
// Returns null when the request is unauthenticated or the token is invalid.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function authenticateRequest(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
}
