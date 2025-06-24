"""
Service module for fetching historical bar data from Alpaca,
merging all paginated results grouped by symbol.
"""

import os
import requests
from typing import Dict, List, Any
from dotenv import load_dotenv
from app.schemas.data import HistoricalBarsQuery

load_dotenv()

ALPACA_API_KEY = os.getenv("ALPACA_API_KEY")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")
BASE_URL = os.getenv("ALPACA_BASE_URL", "https://data.alpaca.markets/v2/stocks/bars")


def fetch_all_historical_bars(query: HistoricalBarsQuery) -> Dict[str, Any]:
    """
    Fetches and merges paginated historical bar data by symbol.

    Args:
        query (HistoricalBarsQuery): Validated query parameters.

    Returns:
        Dict[str, Any]: Merged result with "bars" as a dict of symbols to list of bars.
    """
    all_data = {
        "bars": {}
    }

    page_token = None

    while True:
        query.page_token = page_token
        params = query.model_dump(exclude_none=True)

        headers = {
            "accept": "application/json",
            "APCA-API-KEY-ID": ALPACA_API_KEY,
            "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
        }

        response = requests.get(BASE_URL, headers=headers, params=params)

        if not response.ok:
            raise Exception(f"Alpaca API error: {response.status_code} - {response.text}")

        data = response.json()

        for symbol, bars in data.get("bars", {}).items():
            if symbol not in all_data["bars"]:
                all_data["bars"][symbol] = []
            all_data["bars"][symbol].extend(bars)

        page_token = data.get("next_page_token")
        if not page_token:
            break

    return all_data
