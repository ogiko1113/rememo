// CORS headers shared by all Edge Functions.
// Allows the Re:Memo mobile app (and dev tools) to call functions from any origin.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
