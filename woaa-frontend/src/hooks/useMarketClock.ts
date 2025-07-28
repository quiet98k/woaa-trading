// hooks/useMarketClock.ts
import { useEffect } from "react";
import { useMarketClockStore } from "../stores/useMarketClockStore";
import { fetchMarketClock } from "../api/marketClock";

export function useMarketClock() {
  const { clock, loading } = useMarketClockStore();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const updateClock = async () => {
      useMarketClockStore.setState({ loading: true });
      try {
        const data = await fetchMarketClock();
        useMarketClockStore.setState({ clock: data, loading: false });

        const now = new Date();
        const next = new Date(data.is_open ? data.next_close : data.next_open);
        const delay = next.getTime() - now.getTime();

        timeoutId = setTimeout(() => {
          updateClock();
        }, Math.max(delay, 1000));
      } catch (err) {
        console.error("❌ Failed to fetch market clock:", err);
        useMarketClockStore.setState({ loading: false });
      }
    };

    updateClock();
    return () => clearTimeout(timeoutId);
  }, []);

  return { clock, loading };
}
