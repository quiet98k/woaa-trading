"""
API routes for managing user settings.
Admins can update any user's settings.
"""

from datetime import datetime
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.schemas.user_setting import UserSettingUpdate, UserSettingOut
from app.services import user_setting as service
from app.auth import get_current_user, get_current_admin_user
from app.models.user import User
from app.services.log import log_action

router = APIRouter(prefix="/user-settings", tags=["user-settings"])

@router.get("/me", response_model=UserSettingOut)
async def get_my_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get settings for the current authenticated user.
    """
    settings = await service.get_user_setting(db, current_user.id)
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")

    await log_action(db, current_user.id, "view_own_user_settings", "Viewed their own user settings")
    return settings

@router.patch("/me/speed", response_model=UserSettingOut)
async def set_my_speed(
    speed: int = Body(..., embed=True, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update simulation speed for the current user.
    """
    setting = await service.get_user_setting(db, current_user.id)
    if not setting:
        raise HTTPException(status_code=404, detail="Settings not found")

    setting.speed = speed
    await db.commit()
    await db.refresh(setting)

    await log_action(db, current_user.id, "set_speed", f"Set speed to {speed}")
    return setting


@router.patch("/me/pause", response_model=UserSettingOut)
async def set_my_pause(
    paused: bool = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Pause or resume the simulation for the current user.
    """
    setting = await service.get_user_setting(db, current_user.id)
    if not setting:
        raise HTTPException(status_code=404, detail="Settings not found")

    setting.paused = paused
    await db.commit()
    await db.refresh(setting)

    state = "paused" if paused else "resumed"
    await log_action(db, current_user.id, "set_pause", f"Simulation {state}")
    return setting

@router.patch("/me/start-time", response_model=UserSettingOut)
async def set_my_start_time(
    start_time: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update simulation start time for the current user.
    Accepts ISO date string (e.g., "2020-05-22") and converts it to a datetime.date object.
    """
    setting = await service.get_user_setting(db, current_user.id)
    if not setting:
        raise HTTPException(status_code=404, detail="Settings not found")

    try:
        parsed_start = datetime.strptime(start_time, "%Y-%m-%d").date()  # 👈 convert to `date`
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    setting.start_time = parsed_start
    await db.commit()
    await db.refresh(setting)

    await log_action(
        db,
        current_user.id,
        "set_start_time",
        f"Set start_time to {start_time}",
    )
    return setting

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

