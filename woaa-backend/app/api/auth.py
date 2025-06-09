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
from app.utils.security import hash_password, verify_password
from app.auth import create_access_token, get_current_admin_user

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
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):  # type: ignore
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "is_admin": user.is_admin
    }
