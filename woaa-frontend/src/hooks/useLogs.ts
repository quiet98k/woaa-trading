/**
 * @fileoverview React Query hooks for fetching logs.
 */

import { useQuery } from "@tanstack/react-query";
import { getMyLogs, getLogsByUserId } from "../api/logs";

/**
 * Hook to fetch the authenticated user's logs.
 */
export function useMyLogs() {
  return useQuery({
    queryKey: ["logs", "me"],
    queryFn: getMyLogs,
  });
}

/**
 * Hook to fetch logs for a specific user (admin-only).
 */
export function useLogsByUserId(userId: string) {
  return useQuery({
    queryKey: ["logs", userId],
    queryFn: () => getLogsByUserId(userId),
    enabled: !!userId,
  });
}
