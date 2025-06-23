"""
API routes for managing user settings.
Admins can update any user's settings.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.schemas.user_setting import UserSettingUpdate, UserSettingOut
from app.services import user_setting as service
from app.auth import get_current_user, get_current_admin_user
from app.models.user import User
from app.services.log import log_action


router = APIRouter(prefix="/user-settings", tags=["user-settings"])


@router.get("/{user_id}", response_model=UserSettingOut)
def get_settings(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get user settings for a given user.

    Args:
        user_id: UUID of user
        db: SQLAlchemy session
        current_user: Authenticated user

    Returns:
        UserSettingOut
    """
    
    #TODO: testing
    
    settings = service.get_user_setting(db, user_id)
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")

    log_action(db, current_user.id, "view_user_settings", f"Viewed settings for user {user_id}")
    return settings


@router.put("/{user_id}", response_model=UserSettingOut)
def update_settings(
    user_id: UUID,
    updates: UserSettingUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Update user settings (admin-only access).

    Args:
        user_id: UUID of the user to update
        updates: New setting values
        db: SQLAlchemy session
        _: Injected admin user

    Returns:
        Updated user settings
    """
    
    #TODO: testing

    log_action(db, admin_user.id, "update_user_settings", f"Updated settings for user {user_id}")
    return service.update_user_setting(db, user_id, updates)
