/**
 * @fileoverview Handles API requests related to trades.
 */

const BASE_URL = import.meta.env.VITE_API_URL;

//TODO: add log for all of them

/**
 * Create a new trade for the authenticated user.
 *
 * Payload structure:
 * {
 *   symbol: string,           // Stock ticker, e.g. "AAPL"
 *   shares: number,           // Number of shares (> 0)
 *   price: number,            // Trade price per share (> 0)
 *   action: "buy" | "short",  // Trade direction
 *   notes?: string            // Optional notes
 * }
 */
export async function createTrade(trade: any): Promise<any> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}/trades/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(trade),
  });

  // 🔹 If the response is not OK, parse the error and throw it
  if (!res.ok) {
    let errorMsg = res.statusText;
    try {
      const errData = await res.clone().json();
      errorMsg = errData.detail || errData.message || res.statusText;
    } catch {
      /* ignore JSON parse errors, fallback to statusText */
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

/**
 * Close an existing position (sell for Long, cover for Short).
 *
 * @param positionId - ID of the position to close
 * @param currentPrice - execution price (> 0)
 * @param notes - optional notes
 */
export async function closeTrade(
  positionId: string,
  currentPrice: number,
  notes: string = ""
): Promise<any> {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/trades/item/${positionId}/close`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ current_price: currentPrice, notes }),
    }
  );

  // TODO: add log

  if (!res.ok) {
    let errorMsg = res.statusText;
    try {
      const errData = await res.clone().json();
      errorMsg = errData.detail || errData.message || res.statusText;
    } catch {
      /* ignore JSON parse errors */
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

/**
 * Delete (power-up delete) an open position.
 * Charges fee (per user settings), refunds principal to sim, deletes position.
 *
 * @param positionId - ID of the position to delete
 */
export async function deleteTrade(positionId: string): Promise<any> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/trades/item/${positionId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // TODO: add log

  if (!res.ok) {
    let errorMsg = res.statusText;
    try {
      const errData = await res.clone().json();
      errorMsg = errData.detail || errData.message || res.statusText;
    } catch {
      /* ignore JSON parse errors */
    }
    throw new Error(errorMsg);
  }

  // Handle both 200 with JSON body and 204 No Content
  if (res.status === 204) return { ok: true };
  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
}
