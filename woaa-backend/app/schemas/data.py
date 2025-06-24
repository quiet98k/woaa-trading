"""
Pydantic schemas for Alpaca historical bars query.
Used for validating request query parameters.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal


class HistoricalBarsQuery(BaseModel):
    """
    Query parameters for requesting Alpaca historical stock bars.
    """
    symbols: str = Field(..., description="Comma-separated stock symbols (e.g., AAPL,MSFT)")
    timeframe: str = Field(..., description="Bar timeframe (e.g., 1Min, 5Min, 1Day, 1W, 3M)")
    start: str = Field(..., description="Start date (YYYY-MM-DD or RFC-3339)")
    end: str = Field(..., description="End date (YYYY-MM-DD or RFC-3339)")
    limit: Optional[int] = Field(1000, ge=1, le=10000, description="Max number of bars (across all symbols)")
    adjustment: Optional[Literal["raw", "adjusted"]] = Field("raw", description="Corporate action adjustment")
    asof: Optional[str] = Field(None, description="As-of date for symbol mapping (YYYY-MM-DD)")
    feed: Optional[Literal["sip", "iex", "otc"]] = Field("sip", description="Data feed source")
    currency: Optional[str] = Field("USD", description="Currency in ISO 4217 format (e.g., USD)")
    page_token: Optional[str] = Field(None, description="Pagination token for next page")
    sort: Optional[Literal["asc", "desc"]] = Field("asc", description="Sort order of results")
