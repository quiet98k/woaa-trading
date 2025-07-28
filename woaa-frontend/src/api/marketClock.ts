// api/marketClock.ts
const CLOCK_URL = import.meta.env.VITE_API_URL + "/market/clock";

export async function fetchMarketClock(): Promise<{
  is_open: boolean;
  next_open: string;
  next_close: string;
  timestamp: string;
}> {
  const token = localStorage.getItem("token");

  const response = await fetch(CLOCK_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Clock API error: ${errorData.message || response.statusText}`
    );
  }

  return await response.json();
}
