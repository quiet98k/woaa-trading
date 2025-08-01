// stores/useTradeProcessing.ts
import { create } from "zustand";

interface TradeProcessingState {
  processing: boolean;
  setProcessing: (val: boolean) => void;
}

export const useTradeProcessing = create<TradeProcessingState>((set) => ({
  processing: false,
  setProcessing: (val) => set({ processing: val }),
}));
