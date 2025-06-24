/**
 * @fileoverview Handles API requests related to user trading positions.
 */

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Create a new trading position.
 *
 * @param position - The position object to be created.
 * @returns Promise resolving to the created position.
 */
export async function createPosition(position: any): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/positions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(position),
  });
  if (!res.ok) throw new Error("Failed to create position");
  return res.json();
}

/**
 * Fetch all trading positions for the authenticated user.
 *
 * @returns Promise resolving to an array of positions.
 */
export async function getMyPositions(): Promise<any[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/positions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch positions");
  return res.json();
}

/**
 * Fetch a specific position by its ID.
 *
 * @param positionId - UUID of the position.
 * @returns Promise resolving to the position data.
 */
export async function getPosition(positionId: string): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/positions/${positionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch position");
  return res.json();
}

/**
 * Update a specific trading position.
 *
 * @param positionId - UUID of the position.
 * @param updates - Fields to update in the position.
 * @returns Promise resolving to the updated position.
 */
export async function updatePosition(
  positionId: string,
  updates: any
): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/positions/${positionId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update position");
  return res.json();
}

/**
 * Delete a specific position by ID.
 *
 * @param positionId - UUID of the position.
 */
export async function deletePosition(positionId: string): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/positions/${positionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete position");
}
