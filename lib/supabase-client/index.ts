import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function initSupabase(url: string, anonKey: string): SupabaseClient {
  supabase = createClient(url, anonKey);
  return supabase;
}

export function getSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase not initialized.');
  return supabase;
}

export async function signUp(email: string, password: string) {
  return getSupabase().auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return getSupabase().auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return getSupabase().auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await getSupabase().auth.getUser();
  return data.user;
}

export async function getDueCards(userId: string) {
  return getSupabase()
    .from('srs_cards')
    .select('*, learning_units(*, learning_events(*))')
    .eq('user_id', userId)
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true });
}

export async function getPointBalance(userId: string): Promise<number> {
  const { data } = await getSupabase().from('user_settings').select('point_balance').eq('user_id', userId).single();
  return data?.point_balance ?? 0;
}

export async function getUserSettings(userId: string) {
  return getSupabase().from('user_settings').select('*').eq('user_id', userId).single();
}
