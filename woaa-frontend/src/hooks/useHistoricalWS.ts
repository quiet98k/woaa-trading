import { useEffect, useRef, useState, useCallback } from "react";

// Valid US stock symbols: 1–5 uppercase letters
const isValidSymbol = (symbol: string) =>
  /^[A-Z]{1,5}$/.test(symbol.trim().toUpperCase());

type Bar = {
  t: string; // ISO timestamp
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

export function useHistoricalWS(
  onBars?: (symbol: string, bars: Bar[]) => void
) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const base = import.meta.env.VITE_API_URL;
    const wsUrl = new URL(
      base.replace(/^http/, "ws") + "/ws/data/historical_bars"
    );
    wsUrl.searchParams.set("token", token);

    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log("📡 HistoricalBars WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.symbol && Array.isArray(msg.bars)) {
          if (typeof onBars === "function") {
            onBars(msg.symbol, msg.bars);
          }
        } else if (msg.info) {
          console.log("ℹ️", msg.info);
        } else if (msg.error) {
          console.error("❌", msg.error);
        }
      } catch (err) {
        console.error("❌ Failed to parse historical bars message:", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.warn("📴 HistoricalBars WebSocket closed");
    };

    ws.onerror = (err) => {
      console.error("⚠️ HistoricalBars WebSocket error:", err);
    };

    return () => {
      ws.close();
    };
  }, [onBars]);

  const sendMessage = useCallback(
    (action: "subscribe" | "unsubscribe", symbol: string) => {
      const trimmed = symbol.trim().toUpperCase();
      if (!isValidSymbol(trimmed)) {
        console.warn("❌ Invalid symbol format:", symbol);
        return;
      }

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action, symbol: trimmed }));
      } else {
        console.warn("⚠️ WebSocket is not open; cannot send", {
          action,
          symbol,
        });
      }
    },
    []
  );

  const subscribe = useCallback(
    (symbol: string) => sendMessage("subscribe", symbol),
    [sendMessage]
  );

  const unsubscribe = useCallback(
    (symbol: string) => sendMessage("unsubscribe", symbol),
    [sendMessage]
  );

  return {
    connected,
    subscribe,
    unsubscribe,
  };
}
