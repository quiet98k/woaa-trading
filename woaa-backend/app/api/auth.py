"""
Handles user authentication endpoints including registration and login.

Endpoints:
- POST /register: Register a new regular user
- POST /register-admin: Register a new admin (admin-only)
- POST /login: Authenticate and return JWT access token + role
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db
from app.schemas.user import UserCreate, UserOut, AdminCreate
from app.models.user import User
from app.auth import create_access_token, get_current_admin_user
from app.services.user import (
    create_user_with_settings,
    create_admin_user,
)
from app.services.log import log_action

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new regular user.

    Args:
        user (UserCreate): Incoming user registration data.
        db (Session): SQLAlchemy database session.

    Returns:
        UserOut: The newly registered user's profile data.

    Raises:
        HTTPException: If the email or username is already taken.
    """

    #TODO: testing

    new_user = create_user_with_settings(db, user)
    log_action(db, new_user.id, "register", f"User {new_user.username} registered.")

    return new_user


@router.post("/register-admin", response_model=UserOut)
def register_admin(
    admin: AdminCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    Register a new admin user (only allowed by an existing admin).

    Args:
        admin (AdminCreate): Admin user registration data.
        db (Session): SQLAlchemy database session.
        current_user (User): Authenticated admin user.

    Returns:
        UserOut: The newly registered admin user's profile.

    Raises:
        HTTPException: If username or email already exists.
    """

    new_admin = create_admin_user(db, admin)

    #TODO: loging
    #TODO: testing

    return new_admin


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticate user and return an access token.

    Args:
        form_data (OAuth2PasswordRequestForm): User login form data (username = email).
        db (Session): SQLAlchemy database session.

    Returns:
        dict: JWT access token, token type, and is_admin flag.

    Raises:
        HTTPException: If credentials are invalid.
    """

    #TODO: testing

    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.hashed_password or not user.hashed_password.strip() or not user.email:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    from app.utils.security import verify_password
    if not verify_password(form_data.password, user.hashed_password):  # type: ignore
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})

    log_action(db, user.id, "login", f"User {user.username} logged in.")

    return {
        "access_token": token,
        "token_type": "bearer",
        "is_admin": user.is_admin
    }
