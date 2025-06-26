"""
User-related service logic including user creation, admin creation,
and default user setting initialization.
"""

from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from fastapi import HTTPException

from app.models.user import User
from app.models.user_setting import UserSetting, SettingType
from app.schemas.user import UserCreate, AdminCreate
from app.utils.security import hash_password


async def create_default_user_setting(db: AsyncSession, user_id: UUID) -> UserSetting:
    """
    Create default simulation settings for a newly registered user.
    """
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
        start_time=datetime(2024, 5, 1),
        sim_time=datetime(2024, 5, 1),
        speed=1.0
    )
    db.add(default_setting)
    await db.commit()
    await db.refresh(default_setting)
    return default_setting


async def create_user_with_settings(db: AsyncSession, user: UserCreate) -> User:
    """
    Create a new user and associated default settings.
    """
    result = await db.execute(select(User).where(User.email == user.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.execute(select(User).where(User.username == user.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hash_password(user.password),
        is_admin=False
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    await create_default_user_setting(db, new_user.id)
    return new_user


async def create_admin_user_with_settings(db: AsyncSession, admin: AdminCreate) -> User:
    """
    Create a new admin user and default settings.
    """
    result = await db.execute(select(User).where(User.email == admin.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.execute(select(User).where(User.username == admin.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")

    new_admin = User(
        username=admin.username,
        email=admin.email,
        hashed_password=hash_password(admin.password),
        is_admin=True
    )
    db.add(new_admin)
    await db.commit()
    await db.refresh(new_admin)

    await create_default_user_setting(db, new_admin.id)
    return new_admin
