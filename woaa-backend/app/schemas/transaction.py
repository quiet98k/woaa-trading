"""
Pydantic schemas for validating and serializing Transaction data.
"""

from pydantic import BaseModel, UUID4, ConfigDict, Field
from typing import Optional, Literal
from datetime import datetime


class TransactionBase(BaseModel):
    """
    Shared schema attributes for transactions.
    """
    symbol: str
    shares: float
    price: float
    action: Literal["buy", "sell", "cover", "short"]
    commission_charged: float
    commission_type: Literal["real", "sim"]
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    """
    Schema for creating a new transaction.

    Attributes:
        user_id: UUID of the user making the transaction.
    """
    user_id: UUID4


class TransactionUpdate(BaseModel):
    """
    Schema for updating a transaction.
    """
    notes: Optional[str] = None


class TransactionOut(TransactionBase):
    """
    Schema for returning transaction data to the frontend.
    """
    id: UUID4
    user_id: UUID4
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

