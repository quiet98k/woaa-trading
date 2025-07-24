from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, Dict, List, Any
from app.auth import get_current_user
from app.models.user import User
from app.services.fetch_bars_from_alpaca import fetch_bars_from_alpaca

router = APIRouter(prefix="/data", tags=["data"])

@router.get("/bars", response_model=Dict[str, List[Dict[str, Any]]])
async def get_historical_bars(
    symbol: str = Query(..., description="Comma-separated symbols"),
    start: str = Query(..., description="Start datetime in ISO format"),
    end: str = Query(..., description="End datetime in ISO format"),
    timeframe: str = Query("1Min", description="Bar resolution (e.g. 1Min)"),
    limit: int = Query(10000, description="Maximum number of bars"),
    adjustment: str = Query("raw", description="Adjustment type (e.g. raw, split, dividend)"),
    feed: str = Query("iex", description="Market data feed"),
    sort: str = Query("asc", description="Sort order"),
    asof: Optional[str] = Query(None, description="Point-in-time snapshot"),
    current_user: User = Depends(get_current_user),
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Fetch historical candlestick bars from Alpaca for the given symbol and time range.
    """
    try:
        return await fetch_bars_from_alpaca(
            symbol=symbol,
            start=start,
            end=end,
            timeframe=timeframe,
            limit=limit,
            adjustment=adjustment,
            feed=feed,
            sort=sort,
            asof=asof
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch bars: {e}")
