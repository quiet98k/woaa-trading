import { useEffect, useMemo, useRef, useState } from "react";
import { useMarketClock } from "./useMarketClock";

type MinuteBar = {
  T: "b";
  S: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n: number;
  vw: number;
  t: string;
};

type BarMap = Record<string, MinuteBar>;

export function useRealTimeData(symbols: string[]) {
  const isOpen = useMarketClock();
  const socketRef = useRef<WebSocket | null>(null);
  const [latestBars, setLatestBars] = useState<BarMap>({});
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected"
  >("disconnected");
  const [authStatus, setAuthStatus] = useState<
    "pending" | "authenticated" | "failed"
  >("pending");

  const symbolKey = useMemo(() => symbols.join(","), [symbols]);

  useEffect(() => {
    console.log("🧠 useRealTimeData effect running", { isOpen, symbols });

    if (isOpen.loading) {
      console.log("⏳ Waiting for market status...");
      return;
    }

    if (!isOpen.clock?.is_open) {
      console.log("📴 Market closed. Waiting for market to open...");
      //   return;
    }

    if (symbols.length === 0) {
      console.log("⚠️ No symbols to subscribe to.");
      return;
    }

    if (socketRef.current) {
      console.warn("🧹 Cleaning up previous socket before new connection");
      socketRef.current.close();
      socketRef.current = null;
    }

    console.log("🚀 Connecting to WebSocket...");

    const socket = new WebSocket("wss://stream.data.alpaca.markets/v2/iex");
    socketRef.current = socket;
    setConnectionStatus("connected");
    setAuthStatus("pending");

    socket.onopen = () => {
      console.log("🔌 WebSocket opened");
      // ✅ Don't send auth here anymore
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const messages = Array.isArray(data) ? data : [data];

      for (const msg of messages) {
        console.log("📨 Received:", msg);

        // ✅ Send auth only when connection is confirmed
        if (msg.T === "success" && msg.msg === "connected") {
          console.log("🔐 Sending auth...");
          socket.send(
            JSON.stringify({
              action: "auth",
              key: import.meta.env.VITE_ALPACA_API_KEY,
              secret: import.meta.env.VITE_ALPACA_SECRET_KEY,
            })
          );
          setAuthStatus("pending");
        }

        if (msg.T === "error") {
          console.error("❌ WS Error:", msg.msg);
          setAuthStatus("failed");
          socket.close();
          return;
        }

        if (msg.T === "success" && msg.msg === "authenticated") {
          console.log("✅ Authenticated!");
          setAuthStatus("authenticated");

          socket.send(
            JSON.stringify({
              action: "subscribe",
              bars: symbols,
            })
          );
        }

        if (msg.T === "b" && symbols.includes(msg.S)) {
          setLatestBars((prev) => ({ ...prev, [msg.S]: msg }));
        }
      }
    };

    socket.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
    };

    socket.onclose = () => {
      console.warn("🔌 WebSocket closed");
      socketRef.current = null;
      setConnectionStatus("disconnected");
    };

    return () => {
      console.log("🧼 useEffect cleanup running...");
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.close();
      }
      socketRef.current = null;
      setConnectionStatus("disconnected");
    };
  }, [isOpen.loading, isOpen.clock?.is_open, symbolKey]);

  return { latestBars, connectionStatus, authStatus };
}
