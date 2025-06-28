/**
 * @fileoverview React Query hook for fetching Alpaca historical bar data.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchHistoricalBars, type FetchBarsOptions } from "../api/alpaca";

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
