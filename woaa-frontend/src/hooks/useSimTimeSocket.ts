import { useEffect, useState } from "react";

export function useSimTime(userId: string) {
  const [simTime, setSimTime] = useState<Date | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem("token");
    const socket = new WebSocket(
      `ws://localhost:8000/ws/simulation/time?token=${token}`
    );

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
        console.error("Failed to parse sim_time message:", error);
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => {
      socket.close();
    };
  }, [userId]);

  return { simTime, connected };
}
