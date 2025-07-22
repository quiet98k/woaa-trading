import React, { useEffect, useState } from "react";

const TestRealTimePage: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/market");

    socket.onopen = () => {
      setConnected(true);
      console.log("WebSocket connected");
      socket.send(
        JSON.stringify({
          action: "subscribe",
          symbol: "FAKEPACA",
        })
      );
    };

    socket.onmessage = (event) => {
      const msg = event.data;
      setMessages((prev) => [...prev, msg]);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      setConnected(false);
      console.log("WebSocket closed");
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Real-Time Page</h1>
      <p className="mb-2">
        Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}
      </p>
      <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto shadow text-black">
        {messages.map((msg, i) => (
          <pre key={i} className="text-sm whitespace-pre-wrap">
            {msg}
          </pre>
        ))}
      </div>
    </div>
  );
};

export default TestRealTimePage;
