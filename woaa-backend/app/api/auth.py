"""
Handles user authentication endpoints including registration and login.

Endpoints:
- POST /register: Register a new user
- POST /login: Authenticate and return JWT access token
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserOut
from app.models.user import User
from app.utils.security import hash_password, verify_password
from app.auth import create_access_token
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()


@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user with a unique username and email.

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
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Authenticate user and return an access token.

    Args:
        form_data (OAuth2PasswordRequestForm): User login form data.
        db (Session): SQLAlchemy database session.

    Returns:
        dict: Access token and token type.

    Raises:
        HTTPException: If credentials are invalid.
    """
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):  # type: ignore
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
