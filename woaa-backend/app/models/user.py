"""
Defines the SQLAlchemy User model for the users table.
Includes fields for authentication, role, and account balances.
"""

from sqlalchemy import Column, String, Boolean, DateTime, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database import Base

class User(Base):
    """
    SQLAlchemy model representing a user of the trading application.

    Fields:
        - id: Primary key (UUID)
        - username: Unique display name
        - email: Unique user email
        - hashed_password: Hashed password for login
        - real_balance: Real-money account balance
        - sim_balance: Simulated-money account balance
        - is_admin: Boolean flag for admin privileges
        - created_at: Timestamp of account creation
    """
    
    
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    real_balance = Column(Float, default=0.0)  # Real account balance in USD
    sim_balance = Column(Float, default=0.0)   # Simulated balance for trading challenge

    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
