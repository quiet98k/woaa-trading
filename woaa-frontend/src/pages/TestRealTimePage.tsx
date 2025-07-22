import React, { useEffect, useState } from "react";
import { useRealTimeData } from "../hooks/useRealTimeData";

const TestRealTimePage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [symbol, setSymbol] = useState("FAKEPACA");
  const [tracking, setTracking] = useState(false);

  const { connected, subscribe } = useRealTimeData((data) => {
    const payload = Array.isArray(data) ? data[0] : data;
    setMessages((prev) => [...prev, payload]);
  });

  const handleTrack = () => {
    const trimmed = symbol.trim().toUpperCase();
    if (trimmed && connected) {
      subscribe(trimmed);
      setTracking(true);
    }
  };

  return (
    <div className="p-6 ">
      <h1 className="text-2xl font-bold mb-4">Test Real-Time Page</h1>

      <p className="mb-2">
        Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}
      </p>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Enter symbol (e.g. AAPL)"
          className="border border-gray-300 px-2 py-1 rounded-md text-sm"
        />
        <button
          onClick={handleTrack}
          disabled={!connected}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50 "
        >
          {tracking ? "Tracking..." : "Start Tracking"}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto shadow text-black">
        {messages.map((msg, idx) => (
          <pre key={idx} className="text-sm whitespace-pre-wrap">
            {JSON.stringify(msg)}
          </pre>
        ))}
      </div>
    </div>
  );
};

export default TestRealTimePage;
