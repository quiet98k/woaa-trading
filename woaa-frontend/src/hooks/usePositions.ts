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
export function useUpdatePosition(positionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: any) => updatePosition(positionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["position", positionId] });
    },
  });
}

/**
 * Hook to delete a specific position.
 */
export function useDeletePosition(positionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deletePosition(positionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}
