"""
Pydantic schemas for user settings.
Used to validate and serialize settings data.
"""

from pydantic import BaseModel, UUID4, ConfigDict
from typing import Literal
from datetime import datetime


class UserSettingBase(BaseModel):
    """
    Shared fields for creating/updating user settings.
    """
    commission_rate: float
    commission_type: Literal["real", "sim"]

    holding_cost_rate: float
    holding_cost_type: Literal["real", "sim"]

    margin_rate: float
    margin_type: Literal["real", "sim"]

    overnight_fee_rate: float
    overnight_fee_type: Literal["real", "sim"]

    gain_rate_threshold: float
    drawdown_rate_threshold: float

    power_up_fee: float
    power_up_type: Literal["real", "sim"]


class UserSettingUpdate(UserSettingBase):
    """
    Schema for updating user settings (admin only).
    """
    pass


class UserSettingOut(UserSettingBase):
    """
    Schema for returning user settings to the client.
    """
    user_id: UUID4
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

