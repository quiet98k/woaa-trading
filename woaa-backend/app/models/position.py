from sqlalchemy import Column, String, Float, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid, enum

class PositionType(str, enum.Enum):
    long = "Long"
    short = "Short"

class PositionStatus(str, enum.Enum):
    open = "open"
    closed = "closed"

class Position(Base):
    __tablename__ = "positions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    symbol = Column(String, nullable=False)
    position_type = Column(Enum(PositionType), nullable=False)

    open_price = Column(Float, nullable=False)
    open_shares = Column(Float, nullable=False)
    open_time = Column(DateTime, nullable=False)

    close_price = Column(Float)
    close_shares = Column(Float)
    close_time = Column(DateTime)
    realized_pl = Column(Float)

    status = Column(Enum(PositionStatus), nullable=False)
