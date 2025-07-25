const BASE_URL = import.meta.env.VITE_API_URL + "/data/bars";
const CALENDAR_URL = import.meta.env.VITE_API_URL + "/data/market/calendar";

export interface FetchBarsOptions {
  symbols: string;
  start: string;
  end: string;
  timeframe?: string;
  limit?: number;
  adjustment?: "raw" | "all";
  feed?: "sip" | "iex" | "otc";
  asof?: string;
  sort?: "asc" | "desc";
}

/**
 * Fetch market calendar from backend (only needed if you want to display it or do custom filtering).
 */
export async function fetchMarketCalendar(
  start: string,
  end: string
): Promise<Map<string, { open: string; close: string }>> {
  const url = new URL(CALENDAR_URL);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);

  const token = localStorage.getItem("token");
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Calendar API error: ${errorData.message || response.statusText}`
    );
  }

  const data = await response.json();
  const map = new Map<string, { open: string; close: string }>();
  for (const [date, times] of Object.entries(data)) {
    map.set(date, times as { open: string; close: string });
  }
  return map;
}

/**
 * Fetches historical bars from backend.
 */
export async function fetchHistoricalBars(
  options: FetchBarsOptions
): Promise<{ bars: Record<string, any[]>; invalid: boolean }> {
  const {
    symbols,
    start,
    end,
    timeframe = "1Day",
    limit = 10000,
    adjustment = "raw",
    feed = "iex",
    asof,
    sort = "asc",
  } = options;

  const url = new URL(BASE_URL);
  url.searchParams.set("symbol", symbols);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);
  url.searchParams.set("timeframe", timeframe);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("adjustment", adjustment);
  url.searchParams.set("feed", feed);
  url.searchParams.set("sort", sort);
  if (asof) url.searchParams.set("asof", asof);

  const token = localStorage.getItem("token");
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Backend API error: ${errorData.message || response.statusText}`
    );
  }

  const bars = (await response.json()) as Record<string, any[]>;
  const hasValidBars = Object.values(bars).some((arr) => arr.length > 0);

  return { bars, invalid: !hasValidBars };
}
