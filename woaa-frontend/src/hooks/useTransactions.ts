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
 *
 * @param txId - The ID of the transaction to fetch.
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
 *
 * @param userId - The ID of the user whose transactions to fetch.
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
    onError: (error) => {
      console.error("Failed to create transaction:", error);
    },
  });
}

/**
 * Hook to update a transaction.
 *
 * @param txId - The ID of the transaction to update.
 */
export function useUpdateTransaction(txId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: any) => updateTransaction(txId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", txId] });
    },
    onError: (error) => {
      console.error(`Failed to update transaction ${txId}:`, error);
    },
  });
}

/**
 * Hook to delete a transaction.
 *
 * @param txId - The ID of the transaction to delete.
 */
export function useDeleteTransaction(txId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteTransaction(txId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error) => {
      console.error(`Failed to delete transaction ${txId}:`, error);
    },
  });
}
