/**
 * @fileoverview React Query hooks for user settings (admin access required).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserSettings, updateUserSettings } from "../api/userSettings";

/**
 * Hook to fetch a user's settings by ID.
 */
export function useUserSettings(userId: string) {
  return useQuery({
    queryKey: ["settings", userId],
    queryFn: () => getUserSettings(userId),
    enabled: !!userId,
  });
}

/**
 * Hook to update a user's settings.
 */
export function useUpdateUserSettings(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: any) => updateUserSettings(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
    },
  });
}
