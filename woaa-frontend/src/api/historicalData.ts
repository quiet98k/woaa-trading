/**
 * @fileoverview Browser-safe function to fetch historical stock bars from Alpaca Market Data REST API.
 * Uses direct REST API requests instead of the Node.js SDK. Filters intraday bars using the Alpaca calendar.
 */

const BASE_URL = "https://data.alpaca.markets/v2/stocks/bars";
const CALENDAR_URL = "https://api.alpaca.markets/v2/calendar";

/**
 * Options for fetching historical bars from Alpaca.
 */
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
 * Fetch market calendar for the given date range.
 * @param start - Start date in ISO format
 * @param end - End date in ISO format
 * @returns Map of trading date to open/close times
 */
async function fetchMarketCalendar(
  start: string,
  end: string
): Promise<Map<string, { open: string; close: string }>> {
  const url = new URL(CALENDAR_URL);
  url.searchParams.set("start", start);
  url.searchParams.set("end", end);

  const response = await fetch(url.toString(), {
    headers: {
      "APCA-API-KEY-ID": import.meta.env.VITE_ALPACA_API_KEY,
      "APCA-API-SECRET-KEY": import.meta.env.VITE_ALPACA_SECRET_KEY,
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
  for (const day of data) {
    map.set(day.date, { open: day.open, close: day.close });
  }
  return map;
}

/**
 * Fetches historical bars and filters intraday bars based on market open/close hours.
 * @param options - FetchBarsOptions
 * @returns Object containing bars and a flag indicating if all were filtered out
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

  const apiKey = import.meta.env.VITE_ALPACA_API_KEY!;
  const apiSecret = import.meta.env.VITE_ALPACA_SECRET_KEY!;
  const headers = {
    "APCA-API-KEY-ID": apiKey,
    "APCA-API-SECRET-KEY": apiSecret,
  };

  const allBars: Record<string, any[]> = {};
  let pageToken: string | undefined;
  let hasValidBars = false;
  const isIntraday = /^\d+Min$/.test(timeframe);
  const calendar = isIntraday ? await fetchMarketCalendar(start, end) : null;

  while (true) {
    const url = new URL(BASE_URL);
    url.searchParams.set("symbols", symbols);
    url.searchParams.set("start", start);
    url.searchParams.set("end", end);
    url.searchParams.set("timeframe", timeframe);
    url.searchParams.set("limit", limit.toString());
    url.searchParams.set("adjustment", adjustment);
    url.searchParams.set("feed", feed);
    url.searchParams.set("sort", sort);
    if (asof) url.searchParams.set("asof", asof);
    if (pageToken) url.searchParams.set("page_token", pageToken);

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Alpaca API error: ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();

    for (const [symbol, bars] of Object.entries(data.bars ?? {})) {
      const filtered =
        isIntraday && Array.isArray(bars)
          ? (bars as any[]).filter((bar) => {
              const date = new Date(bar.t);
              const ny = new Date(
                date.toLocaleString("en-US", { timeZone: "America/New_York" })
              );
              const day = ny.toISOString().slice(0, 10);
              const time = ny.toTimeString().slice(0, 5);
              const marketHours = calendar?.get(day);
              const isValid =
                marketHours &&
                time >= marketHours.open &&
                time <= marketHours.close;
              if (isValid) hasValidBars = true;
              return isValid;
            })
          : bars;

      allBars[symbol] = allBars[symbol] ?? [];
      allBars[symbol].push(...(filtered as any[]));
    }

    pageToken = data.next_page_token;
    if (!pageToken) break;
  }

  return { bars: allBars, invalid: !hasValidBars };
}
