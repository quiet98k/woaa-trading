"""
Provides utility functions for securely hashing and verifying passwords using bcrypt.
"""

from passlib.context import CryptContext

# Password hashing context using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hashes a plain-text password using bcrypt.

    Args:
        password (str): The raw password to be hashed.

    Returns:
        str: The securely hashed password.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a hashed password.

    Args:
        plain_password (str): The input password provided by the user.
        hashed_password (str): The hashed password stored in the database.

    Returns:
        bool: True if the password matches, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)
