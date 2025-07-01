import { useEffect, useState } from "react";

/**
 * Hook to subscribe to real-time simulation time via WebSocket using token-based auth.
 *
 * @returns { simTime, connected }
 */
export function useSimTime() {
  const [simTime, setSimTime] = useState<Date | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL;
    const wsBase = apiUrl.replace(/^http/, "ws"); // convert http → ws

    const socket = new WebSocket(`${wsBase}/ws/simulation/time?token=${token}`);

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.sim_time) {
          setSimTime(new Date(data.sim_time));
        }
      } catch (error) {
        console.error("❌ Failed to parse sim_time message:", error);
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    return () => {
      socket.close();
    };
  }, []);

  return { simTime, connected };
}
