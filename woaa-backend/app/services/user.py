"""
User-related service logic including user creation, admin creation,
and default user setting initialization.
"""

from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException

from app.models.user import User
from app.models.user_setting import UserSetting, SettingType
from app.schemas.user import UserCreate, AdminCreate
from app.utils.security import hash_password


def create_default_user_setting(db: Session, user_id: UUID) -> UserSetting:
    """
    Create default simulation settings for a newly registered user.

    Args:
        db: SQLAlchemy session.
        user_id: UUID of the new user.

    Returns:
        The created UserSetting.
    """

    #TODO: testing

    default_setting = UserSetting(
        user_id=user_id,
        commission_rate=0.001,
        commission_type=SettingType.SIM,
        holding_cost_rate=0.0005,
        holding_cost_type=SettingType.SIM,
        margin_rate=0.5,
        margin_type=SettingType.SIM,
        overnight_fee_rate=0.0003,
        overnight_fee_type=SettingType.SIM,
        gain_rate_threshold=0.25,
        drawdown_rate_threshold=0.25,
        power_up_fee=10.0,
        power_up_type=SettingType.SIM,
    )
    db.add(default_setting)
    db.commit()
    db.refresh(default_setting)
    return default_setting


def create_user_with_settings(db: Session, user: UserCreate) -> User:
    """
    Create a new user and associated default settings.

    Args:
        db: SQLAlchemy session
        user: UserCreate schema

    Returns:
        The newly created user.
    """
    
    #TODO: testing
    
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        is_admin=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    create_default_user_setting(db, new_user.id)
    return new_user


def create_admin_user(db: Session, admin: AdminCreate) -> User:
    """
    Create a new admin user.

    Args:
        db: SQLAlchemy session
        admin: AdminCreate schema

    Returns:
        The newly created admin user.
    """
    
    #TODO: testing
    
    if db.query(User).filter(User.email == admin.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == admin.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_admin = User(
        username=admin.username,
        email=admin.email,
        hashed_password=hash_password(admin.password),
        is_admin=True
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    return new_admin
