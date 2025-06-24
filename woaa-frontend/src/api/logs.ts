/**
 * @fileoverview Handles API requests related to user logs.
 */

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Fetch logs for the currently authenticated user.
 *
 * @returns Promise resolving to an array of log entries.
 */
export async function getMyLogs(): Promise<any[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/logs/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

/**
 * Fetch logs for a specific user (admin only).
 *
 * @param userId - UUID of the user whose logs are being requested.
 * @returns Promise resolving to an array of log entries.
 */
export async function getLogsByUserId(userId: string): Promise<any[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/logs/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Admin failed to fetch logs");
  return res.json();
}
