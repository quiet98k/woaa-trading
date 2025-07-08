"""
Business logic for user settings.
Provides CRUD operations and admin-only update enforcement.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from fastapi import HTTPException

from app.models.user_setting import UserSetting
from app.schemas.user_setting import UserSettingUpdate
from typing import Optional


async def get_user_setting(db: AsyncSession, user_id: UUID) -> Optional[UserSetting]:
    """
    Retrieve settings for a specific user.
    """
    result = await db.execute(
        select(UserSetting).where(UserSetting.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def update_user_setting(
    db: AsyncSession, user_id: UUID, updates: UserSettingUpdate
) -> UserSetting:
    """
    Update user settings (admin-only logic enforced in API layer).
    """
    setting = await get_user_setting(db, user_id)
    if not setting:
        raise HTTPException(status_code=404, detail="User setting not found")

    for key, value in updates.model_dump().items():
        setattr(setting, key, value)

    await db.commit()
    await db.refresh(setting)
    return setting
