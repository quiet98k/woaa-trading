"""
API routes for managing user settings.
Admins can update any user's settings.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.schemas.user_setting import UserSettingUpdate, UserSettingOut
from app.services import user_setting as service
from app.auth import get_current_user, get_current_admin_user
from app.models.user import User
from app.services.log import log_action

router = APIRouter(prefix="/user-settings", tags=["user-settings"])


@router.get("/{user_id}", response_model=UserSettingOut)
async def get_settings(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user settings for a given user.
    """
    settings = await service.get_user_setting(db, user_id)
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")

    await log_action(db, current_user.id, "view_user_settings", f"Viewed settings for user {user_id}")
    return settings


@router.put("/{user_id}", response_model=UserSettingOut)
async def update_settings(
    user_id: UUID,
    updates: UserSettingUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Update user settings (admin-only access).
    """
    await log_action(db, admin_user.id, "update_user_settings", f"Updated settings for user {user_id}")
    return await service.update_user_setting(db, user_id, updates)
