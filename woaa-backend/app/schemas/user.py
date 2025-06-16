"""
Pydantic schemas for user creation, shared fields, and API responses.
Supports request validation and response serialization with ORM mode enabled.
"""

from pydantic import BaseModel, ConfigDict, EmailStr
from uuid import UUID
from datetime import datetime

#TODO: testing

class UserBase(BaseModel):
    """
    Shared base schema for user fields.

    Attributes:
        username (str): The user's display name.
        email (EmailStr): The user's email address.
    """
    username: str
    email: EmailStr


class UserCreate(UserBase):
    """
    Schema for user registration input.

    Attributes:
        password (str): The user's raw password (to be hashed before storing).
    """
    password: str
    
class AdminCreate(UserCreate):
    """
    Schema for registering an admin user.
    Inherits from UserCreate, but enforces is_admin as True.
    """
    is_admin: bool = True


class UserOut(UserBase):
    """
    Schema for user data returned to the frontend.

    Attributes:
        id (UUID): Unique user identifier.
        real_balance (float): User's real money balance.
        sim_balance (float): User's simulated balance.
        is_admin (bool): Indicates if the user has admin privileges.
        created_at (datetime): Timestamp of when the user was created.
    """
    id: UUID
    real_balance: float
    sim_balance: float
    is_admin: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

