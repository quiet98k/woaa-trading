/**
 * @fileoverview WebSocket utility for requesting historical candlestick data from FastAPI.
 * Sends a query object and handles the result via callbacks.
 */

interface Bar {
  x: string; // ISO string timestamp
  y: [number, number, number, number]; // [open, high, low, close]
}

interface WSResponse {
  name: string;
  data: Bar[];
}

/**
 * Sends a WebSocket request to fetch historical bars.
 *
 * @param query - Object containing the symbol, timeframe, start/end dates.
 * @param onData - Callback for valid bar data.
 * @param onError - Optional callback for errors.
 */
export function requestHistoricalBars(
  query: { symbols: string; [key: string]: any },
  onData: (bars: Bar[]) => void,
  onError?: (error: string) => void
) {
  const ws = new WebSocket("ws://localhost:8000/ws/data/historical");

  ws.onopen = () => {
    console.log("📡 WebSocket opened. Sending query:", query);
    ws.send(JSON.stringify(query));
  };

  ws.onmessage = (event) => {
    console.log("⚡ Raw WS message:", event.data);
    try {
      const result: WSResponse[] = JSON.parse(event.data);
      console.log("✅ Parsed WS response:", result);

      const match = result.find((entry) => entry.name === query.symbols);

      if (!match || !match.data || !Array.isArray(match.data)) {
        throw new Error("No matching symbol data found in response.");
      }

      onData(match.data);
    } catch (err: any) {
      console.error("❌ WebSocket parsing error:", err);
      onError?.("Failed to parse WebSocket response.");
    } finally {
      ws.close();
    }
  };

  ws.onerror = (event) => {
    console.error("🚨 WebSocket error:", event);
    onError?.("WebSocket connection error.");
    ws.close();
  };
}
