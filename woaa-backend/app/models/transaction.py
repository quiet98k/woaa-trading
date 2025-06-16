"""
Defines the SQLAlchemy model for the transactions table.
Stores buy/sell/cover/short actions with metadata like commission and timestamp.
"""

from sqlalchemy import Column, String, Enum, DateTime, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from enum import Enum as PyEnum

from app.database import Base


class ActionType(str, PyEnum):
    BUY = "buy"
    SELL = "sell"
    COVER = "cover"
    SHORT = "short"


class CommissionType(str, PyEnum):
    REAL = "real"
    SIM = "sim"


class Transaction(Base):
    """
    SQLAlchemy model representing a user transaction.

    Fields:
        - id: UUID primary key
        - user_id: Foreign key to users table
        - symbol: Stock symbol
        - shares: Number of shares transacted
        - price: Price per share
        - action: Type of trade action (buy, sell, cover, short)
        - timestamp: When the transaction occurred
        - commission_charged: Fee paid
        - commission_type: 'real' or 'sim'
        - notes: Optional notes
    """
    
    
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    symbol = Column(String, nullable=False)
    shares = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    action = Column(Enum(ActionType), nullable=False)

    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    commission_charged = Column(Float, default=0.0)
    commission_type = Column(Enum(CommissionType), nullable=False)

    notes = Column(Text, nullable=True)
