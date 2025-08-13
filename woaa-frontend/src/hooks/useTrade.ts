/**
 * @fileoverview React Query hooks for trade management.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closeTrade, createTrade } from "../api/trade";

/**
 * Hook to create a new trade for the authenticated user.
 */
export function useCreateTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
    onError: (error: any) => {
      // 🔹 Show the exact error message from the backend
      alert(error.message || "Failed to create trade");
    },
  });
}

/**
 * Hook to close an existing trade (position).
 */
export function useCloseTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      positionId,
      currentPrice,
      notes = "",
    }: {
      positionId: string;
      currentPrice: number;
      notes?: string;
    }) => closeTrade(positionId, currentPrice, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
    onError: (error: any) => {
      alert(error.message || "Failed to close trade");
    },
  });
}
