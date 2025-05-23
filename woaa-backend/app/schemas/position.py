from pydantic import BaseModel, UUID4
from typing import Optional, Literal
from datetime import datetime

class PositionSchema(BaseModel):
    id: UUID4
    user_id: UUID4
    symbol: str
    position_type: Literal["Long", "Short"]

    open_price: float
    open_shares: float
    open_time: datetime

    close_price: Optional[float] = None
    close_shares: Optional[float] = None
    close_time: Optional[datetime] = None
    realized_pl: Optional[float] = None

    status: Literal["open", "closed"]

    class Config:
        orm_mode = True
