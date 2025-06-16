import pytest
from uuid import uuid4
from datetime import datetime
from pydantic import ValidationError
from app.schemas.user import UserCreate, AdminCreate, UserOut

def test_user_create_valid():
    """
    Validates correct user input passes UserCreate.
    """
    user = UserCreate(
        username="test",
        email="test@example.com",
        password="password123"
    )
    assert user.username == "test"

@pytest.mark.parametrize(
    "kwargs",
    [
        {"username": "bad", "email": "not-an-email", "password": "123456"},
        # missing password field
        {"username": "no-pass", "email": "no@pass.com"},
    ],
)
def test_user_create_invalid_inputs(kwargs):
    """Invalid combinations for ``UserCreate`` should raise errors."""
    with pytest.raises(ValidationError):
        UserCreate(**kwargs)

def test_admin_create_defaults_to_true():
    """
    AdminCreate should default to is_admin=True
    """
    admin = AdminCreate(
        username="admin",
        email="admin@ex.com",
        password="adminpass"
    )
    assert admin.is_admin is True

def test_user_out_serialization():
    """
    Test UserOut schema serialization.
    """
    user_data = {
        "id": uuid4(),
        "username": "serial",
        "email": "serial@example.com",
        "real_balance": 100.0,
        "sim_balance": 5000.0,
        "is_admin": False,
        "created_at": datetime.utcnow(),
    }

    user_out = UserOut(**user_data)
    assert user_out.username == "serial"
    assert user_out.sim_balance == 5000.0

def test_user_out_invalid_types():
    """
    Invalid field types in UserOut should raise errors.
    """
    with pytest.raises(ValidationError):
        UserOut(
            id="not-a-uuid",
            username="bad",
            email="bad@example.com",
            real_balance="not-a-float",
            sim_balance=100,
            is_admin="nope",
            created_at="today"
        )
