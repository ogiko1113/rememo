import { create } from 'zustand';
import type { UserSettings } from '../types';

interface UserState {
  settings: UserSettings | null;
  setSettings: (settings: UserSettings | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
}));
