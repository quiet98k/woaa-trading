import asyncio
import time
from app.services.fetch_bars_from_alpaca import fetch_bars_from_alpaca
from dateutil import parser

SYMBOLS = [
    "AAPL",
    # "GOOGL", "NVDA", "COST", "SPY",
    # "DIA", "QQQ", "LCID", "VXX"
]

async def test_alpaca_latency():
    symbol_str = ",".join(SYMBOLS)
    print(f"{symbol_str = }")
    start_time_iso = "2025-07-22T13:32:00Z"
    end_time_iso = "2025-07-22T13:32:59Z"
    timeframe = "1Min"

    print(f"Fetching 1-minute bars for {len(SYMBOLS)} symbol(s) over 1 day...")

    start = time.perf_counter()
    bars_by_symbol = await fetch_bars_from_alpaca(
        symbol=symbol_str,
        start=start_time_iso,
        end=end_time_iso,
        timeframe=timeframe,
        limit=10000  # Max allowed
    )
    end = time.perf_counter()

    # Total bars across all symbols
    total_bars = sum(len(bars) for bars in bars_by_symbol.values())
    print(f"✅ Done in {(end - start):.2f} seconds")
    print(f"📊 Total bars received: {total_bars}")

    # Per-symbol bar count
    for sym in SYMBOLS:
        bars = bars_by_symbol.get(sym, [])
        count = len(bars)

        if count == 0:
            print(f"  {sym}: 0 bars")
            continue

        times = [parser.isoparse(bar["t"]) for bar in bars]
        earliest = min(times)
        latest = max(times)

        print(f"  {sym}: {count} bars")
        print(f"       Range: {earliest.isoformat()} → {latest.isoformat()}")

if __name__ == "__main__":
    asyncio.run(test_alpaca_latency())
