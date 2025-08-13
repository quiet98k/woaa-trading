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
