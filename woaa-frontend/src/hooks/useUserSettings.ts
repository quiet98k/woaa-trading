import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserSettings,
  getUserSettingsById,
  updateUserSettings,
  updateUserSpeed,
  updateUserPause,
  updateUserStartTime,
} from "../api/userSettings";

/**
 * Fetches the current user's settings.
 */
export function useUserSettings() {
  return useQuery({
    queryKey: ["settings", "me"],
    queryFn: getUserSettings,
  });
}

/**
 * Update simulation speed for current user.
 */
export function useUpdateSpeed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (speed: number) => updateUserSpeed({ speed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "me"] });
    },
  });
}

/**
 * Toggle pause/resume simulation for current user.
 */
export function useUpdatePause() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paused: boolean) => updateUserPause({ paused }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "me"] });
    },
  });
}

export function useUpdateStartTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (start_time: string) => updateUserStartTime({ start_time }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "me"] });
    },
  });
}

/**
 * Admin-only: Fetch settings for a specific user.
 */
export function useUserSettingsById(userId: string) {
  return useQuery({
    queryKey: ["settings", userId],
    queryFn: () => getUserSettingsById(userId),
    enabled: !!userId,
  });
}

/**
 * Admin-only: Update settings for a specific user.
 */
export function useUpdateUserSettings(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: any) => updateUserSettings(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "me"] });
      queryClient.invalidateQueries({ queryKey: ["settings", userId] });
    },
  });
}
