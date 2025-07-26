import { useState, type JSX } from "react";
import SimulationControls from "../components/SimulationControls";
import { useHistoricalWS } from "../hooks/useHistoricalWS";

export default function TestHistoricalWS(): JSX.Element {
  const [symbol, setSymbol] = useState("");
  const [subscribedSymbol, setSubscribedSymbol] = useState<string | null>(null);
  const [bars, setBars] = useState<Record<string, any[]>>({});

  const { connected, subscribe, unsubscribe } = useHistoricalWS(
    (symbol, newBars) => {
      setBars((prev) => ({
        ...prev,
        [symbol]: [...(prev[symbol] || []), ...newBars],
      }));
    }
  );

  const handleSubscribe = () => {
    const upper = symbol.trim().toUpperCase();
    if (!upper) return;
    subscribe(upper);
    setSubscribedSymbol(upper);
  };

  const handleUnsubscribe = () => {
    if (subscribedSymbol) {
      unsubscribe(subscribedSymbol);
      setSubscribedSymbol(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🧪 Historical WebSocket Test</h1>

      <SimulationControls />

      <div className="flex items-center gap-2">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Enter symbol (e.g., AAPL)"
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        />
        <button
          onClick={handleSubscribe}
          disabled={!connected}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm rounded disabled:opacity-50"
        >
          Subscribe
        </button>
        <button
          onClick={handleUnsubscribe}
          disabled={!connected || !subscribedSymbol}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm rounded disabled:opacity-50"
        >
          Unsubscribe
        </button>
        <span
          className={`text-sm ml-2 ${
            connected ? "text-green-700" : "text-red-500"
          }`}
        >
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>

      {subscribedSymbol && (
        <div className="mt-4 max-h-[400px] overflow-auto text-xs bg-gray-100 p-3 rounded">
          <h2 className="font-medium mb-2">Bars for {subscribedSymbol}</h2>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(bars[subscribedSymbol] ?? [], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
