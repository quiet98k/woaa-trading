// hooks/useMarketClock.ts
import { useEffect } from "react";
import { useMarketClockStore } from "../stores/useMarketClockStore";

export function useMarketClock() {
  const { clock, loading } = useMarketClockStore();

  useEffect(() => {
    const fetchClock = async () => {
      useMarketClockStore.setState({ loading: true });
      try {
        const res = await fetch("https://api.alpaca.markets/v2/clock", {
          headers: {
            "APCA-API-KEY-ID": import.meta.env.VITE_ALPACA_API_KEY,
            "APCA-API-SECRET-KEY": import.meta.env.VITE_ALPACA_SECRET_KEY,
            Accept: "application/json",
          },
        });
        const data = await res.json();
        useMarketClockStore.setState({ clock: data, loading: false });

        const now = new Date();
        const next = new Date(data.is_open ? data.next_close : data.next_open);
        const delay = next.getTime() - now.getTime();

        setTimeout(() => {
          fetchClock();
        }, Math.max(delay, 1000));
      } catch (err) {
        console.error("Failed to fetch market clock:", err);
        useMarketClockStore.setState({ loading: false });
      }
    };

    fetchClock();
  }, []);

  return { clock, loading };
}
