"""
Defines the SQLAlchemy Position model for the positions table.
Tracks long/short trading positions for each user.
"""

from sqlalchemy import Column, String, Enum, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from enum import Enum as PyEnum
import uuid

from app.database import Base


class PositionType(str, PyEnum):
    LONG = "Long"
    SHORT = "Short"


class PositionStatus(str, PyEnum):
    OPEN = "open"
    CLOSED = "closed"


class Position(Base):
    """
    SQLAlchemy model representing a trading position held by a user.

    Fields:
        - id: Primary key (UUID)
        - user_id: Foreign key to the user who owns the position
        - symbol: Stock ticker symbol (e.g., AAPL)
        - position_type: Either Long or Short
        - open_price: Price at which the position was opened
        - open_shares: Number of shares opened
        - open_time: Timestamp of when position was opened
        - close_price: Price at which the position was closed
        - close_shares: Number of shares closed
        - close_time: Timestamp of when position was closed
        - realized_pl: Realized profit or loss
        - status: Position status (open or closed)
    """
    
    
    __tablename__ = "positions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    symbol = Column(String, nullable=False)
    position_type = Column(Enum(PositionType), nullable=False)

    open_price = Column(Float, nullable=False)
    open_shares = Column(Float, nullable=False)
    open_time = Column(DateTime(timezone=True), server_default=func.now())

    close_price = Column(Float, nullable=True)
    close_shares = Column(Float, nullable=True)
    close_time = Column(DateTime(timezone=True), nullable=True)

    realized_pl = Column(Float, default=0.0)
    status = Column(Enum(PositionStatus), default=PositionStatus.OPEN)
