/**
 * @fileoverview React Query hook for fetching Alpaca historical bar data.
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchHistoricalBars,
  type FetchBarsOptions,
  fetchMarketCalendar,
} from "../api/historicalData";

/**
 * Hook to fetch historical bars using Alpaca Market Data API.
 *
 * @param options - FetchBarsOptions passed directly to the API.
 * @param enabled - Optional flag to control query execution.
 * @returns Query result with bars, loading/error states, and `invalid` flag.
 */
export function useHistoricalBars(
  options: FetchBarsOptions,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["historicalBars", options],
    queryFn: () => fetchHistoricalBars(options),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * React Query hook to fetch market calendar between a date range.
 *
 * @param start - ISO string (YYYY-MM-DD)
 * @param end - ISO string (YYYY-MM-DD)
 * @param enabled - Optional flag to control query execution
 */
export function useMarketCalendar(
  start: string,
  end: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ["marketCalendar", start, end],
    queryFn: () => fetchMarketCalendar(start, end),
    enabled,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
