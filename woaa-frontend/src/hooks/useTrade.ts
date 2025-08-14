// hooks/useTrades.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closeTrade, createTrade, deleteTrade } from "../api/trade";
import { useTradeProcessing } from "../stores/useTradeProcessing";

export function useCreateTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["createTrade"],
    mutationFn: createTrade,
    onMutate: () => useTradeProcessing.getState().start(),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["me"] }),
        qc.invalidateQueries({ queryKey: ["transactions"] }),
        qc.invalidateQueries({ queryKey: ["positions"] }),
      ]);
    },
    onError: (e: any) => alert(e.message || "Failed to create trade"),
    onSettled: () => useTradeProcessing.getState().stop(),
  });
}

export function useCloseTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["closeTrade"],
    mutationFn: ({
      positionId,
      currentPrice,
      notes = "",
    }: {
      positionId: string;
      currentPrice: number;
      notes?: string;
    }) => closeTrade(positionId, currentPrice, notes),
    onMutate: () => useTradeProcessing.getState().start(),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["me"] }),
        qc.invalidateQueries({ queryKey: ["transactions"] }),
        qc.invalidateQueries({ queryKey: ["positions"] }),
      ]);
    },
    onError: (e: any) => alert(e.message || "Failed to close trade"),
    onSettled: () => useTradeProcessing.getState().stop(),
  });
}

export function useDeleteTrade() {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["deleteTrade"],
    mutationFn: (positionId: string) => deleteTrade(positionId),
    onMutate: () => useTradeProcessing.getState().start(),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["me"] }),
        qc.invalidateQueries({ queryKey: ["transactions"] }),
        qc.invalidateQueries({ queryKey: ["positions"] }),
      ]);
    },
    onError: (e: any) => alert(e.message || "Failed to delete trade"),
    onSettled: () => useTradeProcessing.getState().stop(),
  });
}
