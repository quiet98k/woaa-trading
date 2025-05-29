"""
Provides JWT-based authentication utilities including token creation and user retrieval.
Uses environment variables to configure expiration time, secret key, and algorithm.
"""

import os
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# OAuth2 scheme that expects token at /login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Generates a JWT access token.

    Args:
        data (dict): The payload to encode, must include `sub` key.
        expires_delta (timedelta, optional): Custom expiration duration.

    Returns:
        str: Encoded JWT token.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Extracts and returns the current user from the JWT token.

    Args:
        token (str): JWT token provided via the Authorization header.

    Returns:
        User: The authenticated SQLAlchemy User instance.

    Raises:
        HTTPException: If the token is invalid or user is not found.
    """
    from app.database import get_db
    from app.models.user import User
    from sqlalchemy.orm import Session

    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    db: Session = next(get_db())
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user
