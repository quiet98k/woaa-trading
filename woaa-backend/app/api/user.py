"""
Provides user-related endpoints such as retrieving the current user's profile.

Endpoints:
- GET /me: Fetch current user's profile based on JWT authentication
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional

from app.database import get_db
from app.auth import get_current_user, get_current_admin_user
from app.schemas.user import UserOut
from app.models.user import User

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/me", response_model=UserOut)
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return current_user


class BalanceUpdate(BaseModel):
    real_balance: Optional[float] = Field(None, ge=0, description="Updated real USD balance")
    sim_balance: Optional[float] = Field(None, ge=0, description="Updated simulated balance")


@router.get("/{user_id}", response_model=UserOut)
async def get_user_by_id(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.patch("/{user_id}/balances", response_model=UserOut)
async def update_user_balances(
    user_id: UUID,
    update_data: BalanceUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    changes = []
    if update_data.real_balance is not None:
        user.real_balance = update_data.real_balance
        changes.append(f"real_balance → {update_data.real_balance}")

    if update_data.sim_balance is not None:
        user.sim_balance = update_data.sim_balance
        changes.append(f"sim_balance → {update_data.sim_balance}")

    if not changes:
        raise HTTPException(status_code=400, detail="No balance fields provided")

    await db.commit()
    await db.refresh(user)


    return user
