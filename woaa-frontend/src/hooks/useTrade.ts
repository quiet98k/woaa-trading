/**
 * @fileoverview React Query hooks for trade management.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTrade } from "../api/trade";

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
