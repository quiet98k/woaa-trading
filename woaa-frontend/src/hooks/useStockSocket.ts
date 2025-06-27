/**
 * @fileoverview
 * React hook to connect to WebSocket and stream historical candlestick bar data.
 * Converts bar data into Lightweight Charts-compatible CandlestickData format.
 */

import { useEffect, useRef, useState } from "react";
export interface HistoricalBarsQuery {
  symbols: string;
  timeframe: string;
  start: string;
  end: string;
}

interface RawBar {
  o: number;
  h: number;
  l: number;
  c: number;
  t: string;
  v: number;
}

interface BarResponse {
  [symbol: string]: RawBar[];
}

export interface CandlestickData {
  time: number; // UNIX seconds
  open: number;
  high: number;
  low: number;
  close: number;
  color?: string;
  borderColor?: string;
  wickColor?: string;
  customValues?: Record<string, unknown>;
}

/**
 * Custom React hook to connect to a stock WebSocket stream and receive historical bar data.
 *
 * @param query - WebSocket query parameters (symbols, timeframe, start, end).
 * @returns An object containing parsed candlestick data and loading state.
 */
export function useStockSocket(query: HistoricalBarsQuery) {
  const [data, setData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("[HOOK] useStockSocket triggered with query:", query);
  }, [query]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/data/historical");
    socketRef.current = ws;

    console.log("[Socket] Connecting to:", ws.url);

    ws.onopen = () => {
      console.log("[Socket] Opened.");
      ws.send(JSON.stringify(query));
    };

    ws.onmessage = (event) => {
      console.log("[Socket] Message received.");
      const payload = JSON.parse(event.data);
      const bars: BarResponse = payload.bars;

      const rawBars = bars[query.symbols] || [];
      console.log("[Socket] Raw Data:", rawBars);
      const transformed: CandlestickData[] = rawBars.map((bar) => {
        const timestamp = new Date(bar.t).getTime() / 1000;
        return {
          time: timestamp,
          open: bar.o,
          high: bar.h,
          low: bar.l,
          close: bar.c,
        };
      });

      console.log("[Socket] Parsed payload:", transformed);
      setData(transformed);
      setLoading(false);
    };

    ws.onerror = (event) => {
      console.error("[Socket] WebSocket error:", event);
    };

    ws.onclose = (event) => {
      console.log(
        `[Socket] Closed. Code: ${event.code} Reason: ${event.reason}`
      );
    };

    return () => {
      if (socketRef.current) {
        console.log("[Socket] Cleaning up connection.");
        socketRef.current.close();
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query.symbols, query.timeframe, query.start, query.end]);

  return { data, loading };
}
