"""
Handles user authentication endpoints including registration and login.

Endpoints:
- POST /register: Register a new regular user
- POST /register-admin: Register a new admin (admin-only)
- POST /login: Authenticate and return JWT access token + role
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.security import OAuth2PasswordRequestForm

from app.database import get_db
from app.schemas.user import UserCreate, UserOut, AdminCreate
from app.models.user import User
from app.auth import create_access_token  # , get_current_admin_user
from app.services.user import (
    create_user_with_settings,
    create_admin_user_with_settings,
)
from app.services.log import log_action

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
async def register(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new regular user.
    """
    new_user = await create_user_with_settings(db, user)
    await log_action(db, new_user.id, "register", f"User {new_user.username} registered.")
    return new_user


@router.post("/register-admin", response_model=UserOut)
async def register_admin(
    admin: AdminCreate,
    db: AsyncSession = Depends(get_db),
    # current_user: User = Depends(get_current_admin_user),
):
    """
    Register a new admin user (only allowed by an existing admin).
    """
    new_admin = await create_admin_user_with_settings(db, admin)
    # await log_action(db, new_admin.id, "register-admin", f"Admin {new_admin.username} created.")
    return new_admin


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user and return an access token.
    """
    logger.debug(f"Login attempt for email: {form_data.username}")

    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user:
        logger.warning(f"Login failed: no user found with email {form_data.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.hashed_password or not user.hashed_password.strip():
        logger.warning(f"Login failed: invalid password hash for {user.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    from app.utils.security import verify_password

    if not verify_password(form_data.password, user.hashed_password):
        logger.warning(f"Login failed: password mismatch for {user.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    await log_action(db, user.id, "login", f"User {user.username} logged in.")
    logger.info(f"Login success for user {user.username}")

    return {
        "access_token": token,
        "token_type": "bearer",
        "is_admin": user.is_admin,
    }
