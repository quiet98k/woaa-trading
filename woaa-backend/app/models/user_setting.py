"""
Defines the SQLAlchemy model for user settings.
Stores simulation and trading configuration parameters for each user.
"""

from sqlalchemy import Boolean, Column, String, Float, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from datetime import datetime

from app.database import Base


class SettingType(str, PyEnum):
    REAL = "real"
    SIM = "sim"


class UserSetting(Base):
    """
    SQLAlchemy model for storing user-specific simulation and trading settings.

    Fields:
        - user_id: UUID, primary key and foreign key to User
        - *_rate: Float values for each fee/threshold type
        - *_type: Enum specifying whether the rate is for real/sim
        - updated_at: Timestamp of last update
    """
    
    
    __tablename__ = "user_settings"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    
    initial_sim_balance = Column(Float, default=100000.0, nullable=False)


    commission_rate = Column(Float, default=0.0)
    commission_type = Column(Enum(SettingType), default=SettingType.SIM)

    holding_cost_rate = Column(Float, default=0.0)
    holding_cost_type = Column(Enum(SettingType), default=SettingType.SIM)

    margin_limit = Column(Float, default=0.0)
    borrowed_margin = Column(Float, default=0.0, nullable=False)


    overnight_fee_rate = Column(Float, default=0.0)
    overnight_fee_type = Column(Enum(SettingType), default=SettingType.SIM)

    gain_rate_threshold = Column(Float, default=0.25)
    drawdown_rate_threshold = Column(Float, default=0.25)

    power_up_fee = Column(Float, default=0.0)
    power_up_type = Column(Enum(SettingType), default=SettingType.SIM)
    
    start_time = Column(DateTime(timezone=True), nullable=False)
    speed = Column(Float, default=1.0)
    sim_time = Column(DateTime(timezone=True), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    paused = Column(Boolean, nullable=False, default=False)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
