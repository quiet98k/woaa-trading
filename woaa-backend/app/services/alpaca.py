import os
from dotenv import load_dotenv
import aiohttp
import httpx
from typing import Optional, Dict, List, Any
from loguru import logger  # Optional: use print() if you prefer

load_dotenv()

ALPACA_API_KEY = os.getenv("ALPACA_API_KEY")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")
# print(f"{ALPACA_API_KEY = }")
# print(f"{ALPACA_SECRET_KEY = }")
BAR_URL = "https://data.alpaca.markets/v2/stocks/bars"
CALENDAR_URL = "https://api.alpaca.markets/v2/calendar"


async def fetch_bars_from_alpaca(
    symbol: str,  # Can be comma-separated like "AAPL,NVDA"
    start: str,
    end: str,
    timeframe: str = "1Min",
    limit: int = 10000,
    adjustment: str = "raw",
    feed: str = "iex",
    asof: Optional[str] = None,
    sort: str = "asc",
) -> Dict[str, List[Dict[str, Any]]]:
    headers = {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
    }

    all_bars: Dict[str, List[Dict[str, Any]]] = {}
    page_token: Optional[str] = None

    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            params = {
                "symbols": symbol,
                "start": start,
                "end": end,
                "timeframe": timeframe,
                "limit": str(limit),
                "adjustment": adjustment,
                "feed": feed,
                "sort": sort,
            }
            if asof:
                params["asof"] = asof
            if page_token:
                params["page_token"] = page_token
                logger.info(f"{page_token = }")

            response = await client.get(BAR_URL, headers=headers, params=params)
            if response.status_code != 200:
                logger.info(f"Alpaca error {response.status_code}: {response.text}")
                raise Exception(f"Alpaca API error {response.status_code}: {response.text}")

            data = response.json()

            # ✅ Correctly handle all symbols in the response
            for sym, bars in data.get("bars", {}).items():
                all_bars.setdefault(sym, []).extend(bars)

            page_token = data.get("next_page_token")
            if not page_token:
                break

    return all_bars

async def fetch_market_calendar(start: str, end: str) -> dict[str, dict[str, str]]:
    url = f"{CALENDAR_URL}?start={start}&end={end}"
    headers = {
        "APCA-API-KEY-ID": ALPACA_API_KEY,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if not resp.status == 200:
                try:
                    error_data = await resp.json()
                    raise RuntimeError(f"Calendar API error: {error_data.get('message')}")
                except Exception:
                    raise RuntimeError(f"Calendar API HTTP error: {resp.status}")
            data = await resp.json()

    return {day["date"]: {"open": day["open"], "close": day["close"]} for day in data}