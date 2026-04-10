import { create } from 'zustand';
import type { Subscription, User } from '@supabase/supabase-js';
import { supabase } from '../supabase-client/config';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

// 同期フラグ: useEffect 二重実行 / getSession resolve 前の再呼び出しに耐える
let initialized = false;
let authSubscription: Subscription | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  initialize: () => {
    if (initialized) return;
    initialized = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, isLoading: false });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
    authSubscription = subscription;
  },
}));
