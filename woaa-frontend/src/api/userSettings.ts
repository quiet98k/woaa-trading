/**
 * @fileoverview Handles API requests related to user settings.
 */

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Fetch settings for a specific user.
 *
 * @param userId - UUID of the user.
 * @returns Promise resolving to user settings.
 */
export async function getUserSettings(userId: string): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user-settings/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch user settings");
  return res.json();
}

/**
 * Admin-only: Update settings for a specific user.
 *
 * @param userId - UUID of the user.
 * @param updates - New settings data.
 * @returns Promise resolving to updated settings.
 */
export async function updateUserSettings(
  userId: string,
  updates: any
): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user-settings/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update user settings");
  return res.json();
}
