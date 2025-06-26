import { useEffect, useRef, useState } from "react";

/**
 * Custom React hook to connect to the sim_time WebSocket and receive sim_time updates.
 *
 * @returns An object containing the latest sim_time (as ISO string) and loading state.
 */
export function useSimTimeSocket() {
  const [simTime, setSimTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/sim-time");
    socketRef.current = ws;

    ws.onopen = () => {
      setLoading(false);
      // Optionally send a ping or auth if needed
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.sim_time) {
          setSimTime(payload.sim_time);
        }
      } catch (e) {
        console.error("[SimTimeSocket] Failed to parse message:", event.data);
      }
    };

    ws.onerror = (event) => {
      console.error("[SimTimeSocket] WebSocket error:", event);
    };

    ws.onclose = (event) => {
      console.log(`[SimTimeSocket] Closed. Code: ${event.code} Reason: ${event.reason}`);
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return { simTime, loading };
} 