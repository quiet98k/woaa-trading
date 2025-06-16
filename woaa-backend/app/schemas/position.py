"""
Pydantic schemas for Position model used in request and response validation.
"""

from pydantic import BaseModel, UUID4, ConfigDict, Field
from typing import Optional, Literal
from datetime import datetime

#TODO: testing

class PositionBase(BaseModel):
    """
    Shared attributes for Position models.
    """
    symbol: str
    position_type: Literal["Long", "Short"]
    open_price: float
    open_shares: float


class PositionCreate(PositionBase):
    """
    Schema for creating a new position.
    """
    user_id: UUID4


class PositionUpdate(BaseModel):
    """
    Schema for updating an existing position (typically for closing it).
    """
    close_price: Optional[float] = None
    close_shares: Optional[float] = None
    close_time: Optional[datetime] = None
    realized_pl: Optional[float] = None
    status: Optional[Literal["open", "closed"]] = None


class PositionInDB(PositionBase):
    """
    Base schema for Position retrieved from DB.
    """
    id: UUID4
    user_id: UUID4
    open_time: datetime
    close_price: Optional[float]
    close_shares: Optional[float]
    close_time: Optional[datetime]
    realized_pl: float
    status: Literal["open", "closed"]

    model_config = ConfigDict(from_attributes=True)



class PositionOut(PositionInDB):
    """
    Schema for sending position data to client.
    """
    pass
