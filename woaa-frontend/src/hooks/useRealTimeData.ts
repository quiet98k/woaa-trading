import { useEffect, useRef, useState, useCallback } from "react";

export function useRealTimeData(onMessage?: (msg: any) => void) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/market");
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (typeof onMessage === "function") {
        onMessage(data);
      }
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    ws.onclose = () => {
      setConnected(false);
      console.warn("🔌 WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, []);

  const subscribe = useCallback((symbol: string) => {
    const trimmed = symbol.trim().toUpperCase();
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "subscribe",
          symbol: trimmed,
        })
      );
    }
  }, []);

  return {
    connected,
    subscribe,
  };
}
