"""
API route for accessing Alpaca historical bars through our backend.
"""

from fastapi import APIRouter, Depends, HTTPException
from app.schemas.data import HistoricalBarsQuery
from app.services.data import fetch_all_historical_bars

router = APIRouter(prefix="/data", tags=["data"])


@router.get("/historical")
async def get_historical_bars(query: HistoricalBarsQuery = Depends()):
    """
    Fetch historical stock bars from Alpaca API.

    Query Parameters:
        - symbols: Comma-separated list of stock symbols.
        - timeframe: Timeframe for bar aggregation.
        - start/end: Optional date range.
        - limit: Max number of bars to return (default 1000).
        - adjustment: Adjustment type (raw or adjusted).
        - asof: Optional as-of date for symbol mapping.
        - feed: Data feed source (sip, iex, otc).
        - currency: ISO 4217 currency code.
        - page_token: For pagination.
        - sort: asc/desc order.

    Returns:
        dict: JSON response with bar data or error message.
    """
    try:
        return await fetch_all_historical_bars(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
