import { create } from 'zustand';
import type { ExtractionResult, SourceType } from '../types';

interface LearningState {
  rawText: string;
  extractionResult: ExtractionResult | null;
  sourceType: SourceType;
  sourceUrl: string | null;
  setResult: (rawText: string, result: ExtractionResult, sourceType?: SourceType, sourceUrl?: string | null) => void;
  updateResult: (result: ExtractionResult) => void;
  clear: () => void;
}

export const useLearningStore = create<LearningState>((set) => ({
  rawText: '',
  extractionResult: null,
  sourceType: 'memo',
  sourceUrl: null,
  setResult: (rawText, extractionResult, sourceType = 'memo', sourceUrl = null) =>
    set({ rawText, extractionResult, sourceType, sourceUrl }),
  updateResult: (extractionResult) => set({ extractionResult }),
  clear: () => set({ rawText: '', extractionResult: null, sourceType: 'memo', sourceUrl: null }),
}));
