"""
Service module for fetching historical stock bar data from Alpaca using their Python SDK,
returning grouped results by symbol.
"""

import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame
from fastapi.concurrency import run_in_threadpool

load_dotenv()

API_KEY = os.getenv("ALPACA_API_KEY")
API_SECRET = os.getenv("ALPACA_SECRET_KEY")

stock_client = StockHistoricalDataClient(api_key=API_KEY, secret_key=API_SECRET)


async def fetch_all_historical_bars(
    symbols: List[str],
    timeframe: str,
    start: str,
    end: str,
    adjustment: Optional[str] = None,
    feed: Optional[str] = None,
    limit: Optional[int] = None
) -> Dict[str, Any]:
    """
    Fetch historical stock bars using Alpaca SDK and return grouped bars by symbol.

    Args:
        symbols: List of stock symbols.
        timeframe: Timeframe as a string (e.g. "Minute", "Hour", "Day").
        start: ISO timestamp start.
        end: ISO timestamp end.
        adjustment: Optional adjustment setting.
        feed: Optional feed setting.
        limit: Optional bar limit per symbol.

    Returns:
        Dictionary with 'bars' mapping each symbol to a list of bar dicts.

    Raises:
        Exception: If Alpaca SDK call fails or parameters are invalid.
    """
    try:
        tf_enum = getattr(TimeFrame, timeframe)

        request = StockBarsRequest(
            symbol_or_symbols=symbols,
            timeframe=tf_enum,
            start=datetime.fromisoformat(start),
            end=datetime.fromisoformat(end),
            adjustment=adjustment,
            feed=feed,
            limit=limit,
        )

        bars = await run_in_threadpool(stock_client.get_stock_bars, request)
        df = bars.df.reset_index()
        grouped = df.groupby("symbol")

        return {
            "bars": {
                symbol: group.to_dict(orient="records")
                for symbol, group in grouped
            }
        }

    except Exception as e:
        raise Exception(f"Failed to fetch historical stock bars: {e}")
