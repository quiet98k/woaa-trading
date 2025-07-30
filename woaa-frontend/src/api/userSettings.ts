const BASE_URL = import.meta.env.VITE_API_URL;

import { data } from "react-router-dom";
import { logFrontendEvent } from "./logs";

const LOCATION = "api/userSettings.ts";

async function logUserSettingEvent(
  eventType: string,
  res: Response,
  notes: string,
  additional_info: Record<string, any> = {}
) {
  const username = localStorage.getItem("username") || "unknown";

  let errorMsg: string | null = null;
  if (!res.ok) {
    try {
      const errData = await res.clone().json();
      errorMsg = errData.message || errData.detail || res.statusText;
    } catch {
      errorMsg = res.statusText;
    }
  }

  await logFrontendEvent({
    username,
    level: res.ok ? "INFO" : "WARN",
    event_type: eventType,
    status: res.status.toString(),
    error_msg: errorMsg,
    location: LOCATION,
    additional_info,
    notes,
  });

  if (!res.ok) throw new Error(errorMsg || notes);
}

/**
 * Fetch current user's settings.
 */
export async function getUserSettings(): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user-settings/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = res.ok ? await res.clone().json() : {};
  await logUserSettingEvent(
    "api.userSettings.getMe",
    res,
    "Fetch my settings",
    {
      ...data,
    }
  );

  return data;
}

/**
 * Update simulation speed (current user).
 */
export async function updateUserSpeed(data: { speed: number }): Promise<any> {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${BASE_URL}/user-settings/me/speed`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });

  await logUserSettingEvent("api.userSettings.setSpeed", res, "Set my speed", {
    speed: data?.speed,
  });
  if (!res.ok) throw new Error("Failed to update speed");
  return res.json();
}

/**
 * Toggle simulation pause state (current user).
 */
export async function updateUserPause(data: { paused: boolean }): Promise<any> {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${BASE_URL}/user-settings/me/pause`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });

  await logUserSettingEvent("api.userSettings.setPause", res, "Set my pause", {
    paused: data?.paused,
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
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${BASE_URL}/user-settings/me/start-time`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });

  await logUserSettingEvent(
    "api.userSettings.setStartTime",
    res,
    "Set my start time",
    { start_time: data?.start_time }
  );

  if (!res.ok) throw new Error("Failed to update start time");
  return res.json();
}

/**
 * Admin-only: Get settings for a specific user by ID.
 */
export async function getUserSettingsById(userId: string): Promise<any> {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  const res = await fetch(`${BASE_URL}/user-settings/${userId}`, {
    headers,
  });

  const data = res.ok ? await res.clone().json() : {};
  await logUserSettingEvent(
    "api.userSettings.getByUserId",
    res,
    "Get settings by user",
    { ...data }
  );

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
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  console.log("updates", updates);
  const res = await fetch(`${BASE_URL}/user-settings/${userId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updates),
  });

  await logUserSettingEvent(
    "api.userSettings.updateByUserId",
    res,
    "Update settings by user",
    { userId, ...updates }
  );
  if (!res.ok) throw new Error("Failed to update user settings");
  return res.json();
}
