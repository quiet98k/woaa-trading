// api/marketClock.ts
const CLOCK_URL = import.meta.env.VITE_API_URL + "/market/clock";
import { logFrontendEvent } from "./logs";

const LOCATION = "api/marketClock.ts";

export async function fetchMarketClock(): Promise<{
  is_open: boolean;
  next_open: string;
  next_close: string;
  timestamp: string;
}> {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username") || "unknown";

  const response = await fetch(CLOCK_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Determine error message if any
  let errorMsg: string | null = null;
  if (!response.ok) {
    try {
      const errorData = await response.clone().json();
      errorMsg = errorData.message || response.statusText;
    } catch {
      errorMsg = response.statusText;
    }
  }

  const data = await response.json();

  // Log the API call
  await logFrontendEvent({
    username,
    level: response.ok ? "INFO" : "WARN",
    event_type: "api.market.clock",
    status: response.status.toString(),
    error_msg: errorMsg,
    location: LOCATION,
    additional_info: {
      timestamp: data?.timestamp,
      open: data?.is_open,
    },
    notes: response.ok
      ? `Fetched market clock`
      : "Failed to fetch market clock",
  });

  if (!response.ok) {
    throw new Error(errorMsg || "Clock API error");
  }

  return data;
}
