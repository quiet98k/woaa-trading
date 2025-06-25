/**
 * @fileoverview React hook for streaming candlestick data via WebSocket from FastAPI backend.
 */

import { useEffect, useRef, useState } from "react";

export interface CandlestickBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface StockQuery {
  symbols: string;
  timeframe: string;
  start: string;
  end: string;
}

/**
 * Custom hook to open a WebSocket connection to FastAPI and receive candlestick data.
 *
 * @param params - Query parameters for historical bars.
 * @returns Candlestick data and loading state.
 */
export function useStockSocket(params: StockQuery) {
  const [data, setData] = useState<CandlestickBar[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);

  const baseHttp = import.meta.env.VITE_API_URL;
  const wsProtocol = baseHttp.startsWith("https") ? "wss" : "ws";
  const wsUrl = baseHttp.replace(/^http/, wsProtocol);

  useEffect(() => {
    console.log("[Socket] Connecting to:", `${wsUrl}/ws/data/historical`);
    const ws = new WebSocket(`${wsUrl}/ws/data/historical`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[Socket] Opened.");
      const message = JSON.stringify(params);
      console.log("[Socket] Sending:", message);
      ws.send(message);
    };
    ws.onmessage = (event) => {
      console.log("[Socket] Message received.");
      const payload = JSON.parse(event.data);
      console.log("[Socket] Parsed payload:", payload);

      if (Array.isArray(payload)) {
        setData(payload);
      } else if (payload.bars && Array.isArray(payload.bars[params.symbols])) {
        const transformed = payload.bars[params.symbols].map(
          (bar: any, index: number) => ({
            time: Math.floor(new Date(bar.t).getTime() / 1000),
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
          })
        );
        setData(transformed);
      }

      setLoading(false);
    };

    ws.onerror = (err) => {
      console.error("[Socket] WebSocket error:", err);
    };

    ws.onclose = (e) => {
      console.warn("[Socket] Closed. Code:", e.code, "Reason:", e.reason);
    };

    return () => {
      console.log("[Socket] Cleaning up connection.");
      ws.close();
    };
  }, [JSON.stringify(params)]);

  return { data, loading };
}
