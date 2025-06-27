/**
 * @fileoverview Interactive component to test Alpaca bar data fetching with customizable input.
 */

import { useState } from "react";
import { fetchHistoricalBars } from "../api/alpaca";

/**
 * Converts UTC datetime string to a formatted string in Los Angeles time.
 * @param utc - The UTC datetime string.
 * @returns Localized datetime string in America/Los_Angeles.
 */
function formatToLA(utc: string): string {
  return new Date(utc).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: false,
  });
}

/**
 * Converts datetime-local input to ISO 8601 UTC string.
 * @param local - Input string from datetime-local (e.g., "2024-03-01T09:30")
 * @returns ISO UTC string (e.g., "2024-03-01T17:30:00.000Z")
 */
function toUtcISOString(local: string): string {
  return new Date(local).toISOString();
}

export default function AlpacaTest() {
  const [symbols, setSymbols] = useState("AAPL");
  const [start, setStart] = useState("2024-03-01T09:30");
  const [end, setEnd] = useState("2024-03-01T16:00");
  const [timeframe, setTimeframe] = useState("1Min");
  const [bars, setBars] = useState<Record<string, any[]> | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setBars(null);
    setInvalid(false);
    try {
      const result = await fetchHistoricalBars({
        symbols,
        start: toUtcISOString(start),
        end: toUtcISOString(end),
        timeframe,
      });
      setBars(result.bars);
      setInvalid(result.invalid);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold">Alpaca Bar Data Tester</h1>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <label className="flex flex-col">
          Symbols (comma-separated)
          <input
            type="text"
            value={symbols}
            onChange={(e) => setSymbols(e.target.value)}
            className="p-1 border rounded"
          />
        </label>

        <label className="flex flex-col">
          Timeframe
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="p-1 border rounded bg-white text-black"
          >
            <option value="1Min">1Min</option>
            <option value="5Min">5Min</option>
            <option value="30Min">30Min</option>
            <option value="1Hour">1Hour</option>
            <option value="1Day">1Day</option>
            <option value="1Week">1Week</option>
            <option value="1Month">1Month</option>
          </select>
        </label>

        <label className="flex flex-col">
          Start Date
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="p-1 border rounded"
          />
        </label>

        <label className="flex flex-col">
          End Date
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="p-1 border rounded"
          />
        </label>
      </div>

      <button
        onClick={handleFetch}
        className="bg-blue-600 text-white py-1.5 px-4 rounded hover:bg-blue-700 transition"
      >
        Fetch Bars
      </button>

      {loading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {invalid && (
        <p className="text-yellow-600 font-medium">
          ⚠️ No bars found inside valid market hours. Check time range or date.
        </p>
      )}

      {bars && (
        <div className="mt-4 space-y-2">
          <h2 className="text-md font-semibold">Fetched Bar Data</h2>
          <ul className="text-sm list-disc list-inside">
            {Object.entries(bars).map(([symbol, barArray]) => (
              <li key={symbol} className="text-white">
                <strong>{symbol}</strong>: {barArray.length} bars
                <ul className="ml-4 text-xs">
                  {barArray.slice(0, 3).map((bar, i) => (
                    <li key={i}>
                      UTC: {bar.t} → LA: {formatToLA(bar.t)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-96 overflow-y-scroll text-black">
            {JSON.stringify(bars, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
