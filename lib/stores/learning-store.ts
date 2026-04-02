import { create } from 'zustand';
import type { ExtractionResult } from '../types';

interface LearningState {
  rawText: string;
  extractionResult: ExtractionResult | null;
  setResult: (rawText: string, result: ExtractionResult) => void;
  updateResult: (result: ExtractionResult) => void;
  clear: () => void;
}

export const useLearningStore = create<LearningState>((set) => ({
  rawText: '',
  extractionResult: null,
  setResult: (rawText, extractionResult) => set({ rawText, extractionResult }),
  updateResult: (extractionResult) => set({ extractionResult }),
  clear: () => set({ rawText: '', extractionResult: null }),
}));
