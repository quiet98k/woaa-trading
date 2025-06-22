"""
Provides user-related endpoints such as retrieving the current user's profile.

Endpoints:
- GET /me: Fetch current user's profile based on JWT authentication
"""

from requests import Session
from app.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from app.auth import get_current_user, get_current_admin_user
from app.schemas.user import UserOut
from app.models.user import User
from app.services.log import log_action
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Retrieve the profile of the currently authenticated user.

    Args:
        current_user (User): The authenticated user obtained via dependency injection.

    Returns:
        UserOut: The current user's profile data.
    """
    
    log_action(db, current_user.id, "view_profile", "User fetched their profile via /me")
    #TODO: testing
    
    return current_user

class BalanceUpdate(BaseModel):
    """
    Schema for updating user balances.

    Attributes:
        real_balance (Optional[float]): New real-money balance (USD). Must be non-negative.
        sim_balance (Optional[float]): New simulated balance. Must be non-negative.
    """
    real_balance: Optional[float] = Field(None, ge=0, description="Updated real USD balance")
    sim_balance: Optional[float] = Field(None, ge=0, description="Updated simulated balance")


@router.get("/{user_id}", response_model=UserOut)
def get_user_by_id(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    """
    Retrieve a specific user's profile by UUID (admin access only).

    Args:
        user_id (UUID): The ID of the user to fetch.
        db (Session): Active SQLAlchemy session.
        admin_user (User): Currently authenticated admin user.

    Returns:
        UserOut: The target user's profile data.

    Raises:
        404: If the user is not found.
        403: If the caller is not an admin.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log_action(db, admin_user.id, "admin_get_user", f"Fetched user {user_id}")
    return user


@router.patch("/{user_id}/balances", response_model=UserOut)
def update_user_balances(
    user_id: UUID,
    update_data: BalanceUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    """
    Update the real and/or simulated balances for a specific user (admin access only).

    Args:
        user_id (UUID): The target user's ID.
        update_data (BalanceUpdate): Fields to update.
        db (Session): Active DB session.
        admin_user (User): The authenticated admin performing the update.

    Returns:
        UserOut: The updated user data.

    Raises:
        404: If the user does not exist.
        400: If no valid balance field is provided.
    """
    user = db.query(User).filter(User.id == user_id).first()
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

    db.commit()
    db.refresh(user)

    log_action(
        db,
        admin_user.id,
        "admin_update_balance",
        f"Updated user {user_id}: {'; '.join(changes)}"
    )

    return user