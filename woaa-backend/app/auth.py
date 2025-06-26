"""
Provides JWT-based authentication utilities including token creation and user retrieval.
Uses environment variables to configure expiration time, secret key, and algorithm.
"""

import logging
import os
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, WebSocket, WebSocketException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.database import async_session_maker, get_db

# Load .env variables
load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# OAuth2 scheme that expects token at /login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


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


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Extracts and returns the current user from the JWT token.

    Args:
        token (str): JWT token provided via the Authorization header.
        db (AsyncSession): Async SQLAlchemy session.

    Returns:
        User: The authenticated SQLAlchemy User instance.

    Raises:
        HTTPException: If the token is invalid or user is not found.
    """
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

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    return user

def get_current_admin_user(user=Depends(get_current_user)):
    """
    Verifies that the current user is an admin.

    Args:
        user (User): The currently authenticated user.

    Returns:
        User: The user instance if admin.

    Raises:
        HTTPException: If the user is not an admin.
    """
    if not user.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )
    return user

async def get_current_user_ws(websocket: WebSocket) -> User:
    token = websocket.query_params.get("token")
    if not token:
        logging.warning("❌ [WS Auth] No token found in query params")
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logging.info(f"🔓 [WS Auth] Token decoded: {payload}")
        user_id = payload.get("sub")
        if not user_id:
            logging.warning("❌ [WS Auth] No 'sub' claim in token")
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    except JWTError as e:
        logging.warning(f"❌ [WS Auth] JWT error: {e}")
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    async with async_session_maker() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            logging.warning(f"❌ [WS Auth] No user found for ID: {user_id}")
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

        logging.info(f"✅ [WS Auth] User authenticated: {user.username} ({user.id})")
        return user