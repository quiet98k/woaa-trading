/**
 * @fileoverview React hook to manage historical bar loading via WebSocket.
 * Automatically fetches data on `symbol` or range change.
 */

import { useEffect, useState } from "react";
import { requestHistoricalBars } from "../api/stockSocket";

/**
 * Hook to fetch and format historical OHLC data from WebSocket.
 *
 * @param query - Historical bar query params including `symbols`, `start`, `end`, etc.
 * @returns Formatted bar data, loading state, and error.
 */
export function useHistoricalBars(query: {
  symbols: string;
  [key: string]: any;
}) {
  const [data, setData] = useState<
    { x: number; y: [number, number, number, number] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    requestHistoricalBars(
      query,
      (res) => {
        const formatted = res.map((bar) => ({
          x: new Date(bar.x).getTime(),
          y: bar.y,
        }));

        setData(formatted);
        setLoading(false);
      },
      (err) => {
        setError(String(err));
        setLoading(false);
      }
    );
  }, [JSON.stringify(query)]); // retrigger on any query change

  return { data, loading, error };
}
