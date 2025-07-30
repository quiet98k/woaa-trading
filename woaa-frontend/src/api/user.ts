/**
 * @fileoverview Handles API requests related to user data,
 * including fetching the current user's profile and performing admin-level actions.
 */

const BASE_URL = import.meta.env.VITE_API_URL;
import { logFrontendEvent } from "./logs";

const LOCATION = "api/user.ts";

/**
 * Unified logger for user API calls
 */
async function logUserEvent(
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
 * Fetches the profile of the currently authenticated user.
 */
export async function getMe(): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = res.ok ? await res.clone().json() : {};
  await logUserEvent("api.user.getMe", res, "Fetch current user", {
    userId: data?.id ?? null,
    username: data?.username,
    sim_balance: data?.sim_balance,
    real_balance: data?.real_balance,
  });

  return res.ok ? data : {};
}

/**
 * Fetches a user's profile by their UUID (admin-only access).
 */
export async function getUserById(userId: string): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = res.ok ? await res.clone().json() : {};
  await logUserEvent("api.user.getById", res, "Fetch user by ID", {
    userId: data?.id ?? null,
    username: data?.username,
    sim_balance: data?.sim_balance,
    real_balance: data?.real_balance,
  });

  return res.json();
}

/**
 * Updates a user's real and/or simulated balances (admin-only access).
 */
export async function updateUserBalances(
  userId: string,
  data: { real_balance?: number; sim_balance?: number }
): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/user/${userId}/balances`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  await logUserEvent("api.user.updateBalances", res, "Update user balances", {
    userId,
    ...data,
  });

  return res.json();
}
