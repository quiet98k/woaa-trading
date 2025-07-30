/**
 * @fileoverview Handles API requests related to user trading positions.
 */
const BASE_URL = import.meta.env.VITE_API_URL;
import { logFrontendEvent } from "./logs";

const LOCATION = "api/positions.ts";

/**
 * Helper to log position API events
 */
async function logPositionEvent(
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
      errorMsg = errData.message || res.statusText;
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
 * Create a new trading position.
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

  await logPositionEvent("api.positions.create", res, "Create position", {
    symbol: position?.symbol,
    position_type: position?.position_type,
    open_shares: position?.open_shares,
    open_price: position?.open_price,
  });

  return res.json();
}

/**
 * Fetch all trading positions for the authenticated user.
 */
export async function getMyPositions(): Promise<any[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/positions`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = res.ok ? await res.clone().json() : [];
  await logPositionEvent("api.positions.getAll", res, "Fetch my positions", {
    count: data.length ?? 0,
  });

  return res.ok ? data : [];
}

/**
 * Fetch a specific position by its ID.
 */
export async function getPosition(positionId: string): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/positions/${positionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  await logPositionEvent("api.positions.get", res, "Fetch position", {
    positionId,
  });

  return res.json();
}

/**
 * Update a specific trading position.
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

  await logPositionEvent("api.positions.update", res, "Update position", {
    positionId,
    ...updates,
  });

  return res.json();
}

/**
 * Delete a specific position by ID.
 */
export async function deletePosition(positionId: string): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/positions/${positionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  await logPositionEvent("api.positions.delete", res, "Delete position", {
    positionId,
  });
}
