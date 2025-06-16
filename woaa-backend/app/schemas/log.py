"""
Pydantic schemas for Logs.
Supports serialization and validation of log data.
"""

from pydantic import BaseModel, UUID4, ConfigDict
from datetime import datetime

#TODO: testing


class LogBase(BaseModel):
    """
    Shared log attributes.
    """
    action: str
    details: str


class LogCreate(LogBase):
    """
    Schema for creating a new log.
    """
    user_id: UUID4


class LogOut(LogBase):
    """
    Schema for returning log entries.
    """
    id: UUID4
    user_id: UUID4
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

