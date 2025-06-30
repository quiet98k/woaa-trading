/**
 * @fileoverview React Query hooks for managing positions.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMyPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition,
} from "../api/positions";

/**
 * Hook to fetch all of the current user's positions.
 */
export function useMyPositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: getMyPositions,
  });
}

/**
 * Hook to fetch a single position by ID.
 */
export function usePosition(positionId: string) {
  return useQuery({
    queryKey: ["position", positionId],
    queryFn: () => getPosition(positionId),
    enabled: !!positionId,
  });
}

/**
 * Hook to create a new position.
 */
export function useCreatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPosition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

/**
 * Hook to update a specific position.
 */
export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      positionId,
      updates,
    }: {
      positionId: string;
      updates: any;
    }) => updatePosition(positionId, updates),

    onSuccess: () => {
      // ✅ Automatically refetch positions after successful mutation
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

/**
 * Hook to delete a specific position.
 */
export function useDeletePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (positionId: string) => deletePosition(positionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}
