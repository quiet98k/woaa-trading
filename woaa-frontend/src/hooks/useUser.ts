/**
 * @fileoverview React Query hooks for user data and admin updates.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, getUserById, updateUserBalances } from "../api/user";

/**
 * Hook to fetch the current user's profile.
 */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  });
}

/**
 * Hook to fetch a user by ID (admin-only).
 */
export function useUserById(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to update user balances (admin-only).
 */
export function useUpdateUserBalances(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { real_balance?: number; sim_balance?: number }) =>
      updateUserBalances(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
