"""
Provides user-related endpoints such as retrieving the current user's profile.

Endpoints:
- GET /me: Fetch current user's profile based on JWT authentication
"""

from fastapi import APIRouter, Depends
from app.auth import get_current_user
from app.schemas.user import UserOut
from app.models.user import User

router = APIRouter()


@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Retrieve the profile of the currently authenticated user.

    Args:
        current_user (User): The authenticated user obtained via dependency injection.

    Returns:
        UserOut: The current user's profile data.
    """
    return current_user
