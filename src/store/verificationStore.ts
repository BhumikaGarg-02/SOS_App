import { create } from 'zustand';
import type { SealVerifyResult } from '../lib/seal';

interface VerificationStore {
  results: Record<string, SealVerifyResult | undefined>;
  verifying: Record<string, boolean>;
  setResult: (id: string, result: SealVerifyResult) => void;
  setVerifying: (id: string, isVerifying: boolean) => void;
  clearResult: (id: string) => void;
  clearAll: () => void;
}

export const useVerificationStore = create<VerificationStore>((set) => ({
  results: {},
  verifying: {},
  setResult: (id, result) =>
    set((s) => ({
      results: { ...s.results, [id]: result },
      verifying: { ...s.verifying, [id]: false },
    })),
  setVerifying: (id, isVerifying) =>
    set((s) => ({
      verifying: { ...s.verifying, [id]: isVerifying },
    })),
  clearResult: (id) =>
    set((s) => {
      const nextResults = { ...s.results };
      delete nextResults[id];
      const nextVerifying = { ...s.verifying };
      delete nextVerifying[id];
      return { results: nextResults, verifying: nextVerifying };
    }),
  clearAll: () => set({ results: {}, verifying: {} }),
}));
