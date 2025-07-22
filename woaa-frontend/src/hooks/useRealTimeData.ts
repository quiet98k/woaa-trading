import { useEffect, useRef, useState } from "react";

type MessageHandler = (msg: any) => void;

export function useRealTimeData(symbol: string, onMessage?: MessageHandler) {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/market");
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ action: "subscribe", symbol }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
      if (onMessage) onMessage(data);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  return { connected, messages };
}
