import { useEffect, useRef, useState, useCallback } from "react";

// Valid US stock symbols: 1–5 uppercase letters (basic example)
const isValidSymbol = (symbol: string) =>
  /^[A-Z]{1,5}$/.test(symbol.trim().toUpperCase());

type SubscriptionType = "trades" | "bars";

export function useRealTimeData(onMessage?: (msg: any) => void) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `${import.meta.env.VITE_API_URL.replace(/^http/, "ws")}/ws/market`
    );
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

  const sendMessage = useCallback(
    (action: string, symbol?: string, type: SubscriptionType = "trades") => {
      if (symbol && !isValidSymbol(symbol)) {
        console.warn("❌ Invalid symbol format:", symbol);
        return;
      }

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const msg: any = { action };
        if (symbol) {
          msg.symbol = symbol.trim().toUpperCase();
        }
        if (action !== "get_subscriptions") {
          msg.type = type;
        }
        wsRef.current.send(JSON.stringify(msg));
      }
    },
    []
  );

  const subscribe = useCallback(
    (symbol: string, type: SubscriptionType = "trades") => {
      sendMessage("subscribe", symbol, type);
    },
    [sendMessage]
  );

  const unsubscribe = useCallback(
    (symbol: string, type: SubscriptionType = "trades") => {
      sendMessage("unsubscribe", symbol, type);
    },
    [sendMessage]
  );

  const getSubscriptions = useCallback(() => {
    sendMessage("get_subscriptions");
  }, [sendMessage]);

  return {
    connected,
    subscribe,
    unsubscribe,
    getSubscriptions,
  };
}
