import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase-client/config';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  initialize: () => {
    if (!get().isLoading) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, isLoading: false });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },
}));
