import React from "react";
import { useRealTimeData } from "../hooks/useRealTimeData";

const TestRealTimePage: React.FC = () => {
  const { connected, messages } = useRealTimeData("FAKEPACA");

  return (
    <div className="p-6 text-black">
      <h1 className="text-2xl font-bold mb-4">Test Real-Time Page</h1>
      <p className="mb-2">
        Status: {connected ? "🟢 Connected" : "🔴 Disconnected"}
      </p>
      <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto shadow">
        {messages.map((msg, idx) => (
          <pre key={idx} className="text-sm whitespace-pre-wrap">
            {JSON.stringify(msg, null, 2)}
          </pre>
        ))}
      </div>
    </div>
  );
};

export default TestRealTimePage;
