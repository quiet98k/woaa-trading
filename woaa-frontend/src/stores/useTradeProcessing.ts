// stores/useTradeProcessing.ts
import { create } from "zustand";

interface TradeProcessingState {
  processing: boolean;
  /** number of active mutations */
  _count: number;
  /** start one processing unit (safe with overlap) */
  start: () => void;
  /** finish one processing unit */
  stop: () => void;

  /** legacy: sets boolean directly (not overlap-safe) */
  setProcessing: (val: boolean) => void;
}

export const useTradeProcessing = create<TradeProcessingState>((set) => ({
  processing: false,
  _count: 0,
  start: () => set((s) => ({ _count: s._count + 1, processing: true })),
  stop: () =>
    set((s) => {
      const n = Math.max(0, s._count - 1);
      return { _count: n, processing: n > 0 };
    }),
  setProcessing: (val) => set({ processing: val, _count: val ? 1 : 0 }),
}));
