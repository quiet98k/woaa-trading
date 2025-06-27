"""
Manual test for fetch_all_historical_bars using real Alpaca API.
"""

import sys
from pathlib import Path
import asyncio

# Add project root to PYTHONPATH
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from app.services.data import fetch_all_historical_bars


async def main():
    result = await fetch_all_historical_bars(
        symbols=["AAPL", "TSLA"],
        timeframe="Minute",  # Valid values: Minute, Hour, Day, etc.
        start="2024-06-01T09:30:00",
        end="2024-06-01T16:00:00",
        adjustment=None,  # or "raw", "split", "dividend", "all"
        feed=None,        # or "sip", "iex"
        limit=100
    )

    for symbol, bars in result["bars"].items():
        print(f"\n=== {symbol} ===")
        for bar in bars[:5]:  # print first 5 bars per symbol
            print(bar)


if __name__ == "__main__":
    asyncio.run(main())
