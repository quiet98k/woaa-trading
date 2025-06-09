"""
Business logic for user settings.
Provides CRUD operations and admin-only update enforcement.
"""

from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException

from app.models.user_setting import UserSetting
from app.schemas.user_setting import UserSettingUpdate


def get_user_setting(db: Session, user_id: UUID) -> UserSetting | None:
    """
    Retrieve settings for a specific user.
    """
    
    #TODO: testing
    
    return db.query(UserSetting).filter(UserSetting.user_id == user_id).first()


def update_user_setting(
    db: Session, user_id: UUID, updates: UserSettingUpdate
) -> UserSetting:
    """
    Update user settings (admin-only logic enforced in API layer).

    Args:
        db: DB session
        user_id: UUID of the user to update settings for
        updates: Fields to modify

    Returns:
        Updated UserSetting object

    Raises:
        HTTPException: If setting not found
    """
    
    #TODO: testing
    
    setting = get_user_setting(db, user_id)
    if not setting:
        raise HTTPException(status_code=404, detail="User setting not found")

    for key, value in updates.model_dump().items():
        setattr(setting, key, value)

    db.commit()
    db.refresh(setting)
    return setting
