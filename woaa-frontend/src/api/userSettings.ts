const BASE_URL = import.meta.env.VITE_API_URL;
const token = localStorage.getItem("token");
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
};

/**
 * Fetch current user's settings.
 */
export async function getUserSettings(): Promise<any> {
  const res = await fetch(`${BASE_URL}/user-settings/me`, {
    headers,
  });
  if (!res.ok) throw new Error("Failed to fetch user settings");
  return res.json();
}

/**
 * Update simulation speed (current user).
 */
export async function updateUserSpeed(data: { speed: number }): Promise<any> {
  const res = await fetch(`${BASE_URL}/user-settings/me/speed`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update speed");
  return res.json();
}

/**
 * Toggle simulation pause state (current user).
 */
export async function updateUserPause(data: { paused: boolean }): Promise<any> {
  const res = await fetch(`${BASE_URL}/user-settings/me/pause`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update pause state");
  return res.json();
}

/**
 * Update simulation start date (current user).
 */
export async function updateUserStartTime(data: {
  start_time: string;
}): Promise<any> {
  const res = await fetch(`${BASE_URL}/user-settings/me/start-time`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update start time");
  return res.json();
}

/**
 * Admin-only: Get settings for a specific user by ID.
 */
export async function getUserSettingsById(userId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/user-settings/${userId}`, {
    headers,
  });
  if (!res.ok) throw new Error("Failed to fetch user settings by ID");
  return res.json();
}

/**
 * Admin-only: Update full settings for a specific user.
 */
export async function updateUserSettings(
  userId: string,
  updates: any
): Promise<any> {
  console.log("updates", updates);
  const res = await fetch(`${BASE_URL}/user-settings/${userId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update user settings");
  return res.json();
}
