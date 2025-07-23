import React, { useState, useEffect } from "react";
import { useRealTimeData } from "../hooks/useRealTimeData";

const TestRealTimePage: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [symbol, setSymbol] = useState("AAPL");
  const [trackingSymbol, setTrackingSymbol] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);

  const { connected, subscribe, unsubscribe, getSubscriptions } =
    useRealTimeData((data) => {
      const payload = Array.isArray(data) ? data[0] : data;

      if (payload?.type === "subscriptions") {
        setSubscriptions(payload.symbols ?? []);
      } else {
        setMessages((prev) => [...prev, payload]);
      }
    });

  const handleSubscribe = () => {
    const trimmed = symbol.trim().toUpperCase();
    if (trimmed && connected) {
      subscribe(trimmed);
      setTrackingSymbol(trimmed);
      setMessages([]);
      setTimeout(() => getSubscriptions(), 200); // Delay to allow server to register
    }
  };

  const handleUnsubscribe = () => {
    const trimmed = symbol.trim().toUpperCase();
    if (trimmed && connected) {
      unsubscribe(trimmed);
      if (trackingSymbol === trimmed) setTrackingSymbol(null);
      setTimeout(() => getSubscriptions(), 200);
    }
  };

  useEffect(() => {
    if (connected) getSubscriptions();
  }, [connected]);

  return (
    <div className="p-6">
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
          onClick={handleSubscribe}
          disabled={!connected}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50"
        >
          Subscribe
        </button>
        <button
          onClick={handleUnsubscribe}
          disabled={!connected}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50"
        >
          Unsubscribe
        </button>
      </div>

      {subscriptions.length > 0 && (
        <p className="mb-4 text-sm">
          Server says you're tracking:{" "}
          <strong>{subscriptions.join(", ")}</strong>
        </p>
      )}

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
