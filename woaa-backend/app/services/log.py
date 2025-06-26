"""
Service functions for managing logs.
Handles creation and retrieval of user logs.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from app.models.log import Log
from app.schemas.log import LogCreate
from typing import List


async def create_log(db: AsyncSession, log_data: LogCreate) -> Log:
    """
    Create a new log entry.
    """
    log = Log(**log_data.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def get_logs_by_user(db: AsyncSession, user_id: UUID) -> List[Log]:
    """
    Retrieve all logs for a specific user, sorted by timestamp descending.
    """
    result = await db.execute(
        select(Log).where(Log.user_id == user_id).order_by(Log.timestamp.desc())
    )
    return result.scalars().all()


async def log_action(db: AsyncSession, user_id: UUID, action: str, details: str) -> None:
    """
    Utility to quickly log a user action.
    """
    log = Log(user_id=user_id, action=action, details=details)
    db.add(log)
    await db.commit()
