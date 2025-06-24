/**
 * @fileoverview React Query hooks for transaction management.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyTransactions,
  getTransactionById,
  getTransactionsByUserId,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../api/transactions";

/**
 * Hook to fetch all transactions for the authenticated user.
 */
export function useMyTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: getMyTransactions,
  });
}

/**
 * Hook to fetch a single transaction by its ID (admin-only).
 */
export function useTransactionById(txId: string) {
  return useQuery({
    queryKey: ["transaction", txId],
    queryFn: () => getTransactionById(txId),
    enabled: !!txId,
  });
}

/**
 * Hook to fetch all transactions for a user (admin-only).
 */
export function useTransactionsByUserId(userId: string) {
  return useQuery({
    queryKey: ["transactions", userId],
    queryFn: () => getTransactionsByUserId(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to create a transaction.
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

/**
 * Hook to update a transaction.
 */
export function useUpdateTransaction(txId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: any) => updateTransaction(txId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", txId] });
    },
  });
}

/**
 * Hook to delete a transaction.
 */
export function useDeleteTransaction(txId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteTransaction(txId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
