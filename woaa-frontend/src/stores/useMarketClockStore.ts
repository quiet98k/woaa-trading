// stores/useMarketClockStore.ts
import { create } from "zustand";

type MarketClock = {
  is_open: boolean;
  next_open: string;
  next_close: string;
  timestamp: string;
};

type State = {
  clock: MarketClock | null;
  loading: boolean;
};

export const useMarketClockStore = create<State>(() => ({
  clock: null,
  loading: true,
}));
