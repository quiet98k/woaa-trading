import uuid
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.position import Position, PositionType, PositionStatus
import random

def create_test_user(db):
    user = User(
        id=uuid.uuid4(),
        username=f"user_{random.randint(1000, 9999)}",
        email=f"user_{random.randint(1000, 9999)}@example.com",
        hashed_password="pass"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def test_create_valid_position(db):
    user = create_test_user(db)

    pos = Position(
        user_id=user.id,
        symbol="AAPL",
        position_type=PositionType.LONG,
        open_price=150.0,
        open_shares=10.0,
    )
    db.add(pos)
    db.commit()
    db.refresh(pos)

    assert pos.symbol == "AAPL"
    assert pos.position_type == PositionType.LONG
    assert pos.realized_pl == 0.0
    assert pos.status == PositionStatus.OPEN
    assert pos.close_price is None

def test_position_without_user_id_fails(db):
    pos = Position(
        user_id=None,
        symbol="GOOG",
        position_type=PositionType.SHORT,
        open_price=2000.0,
        open_shares=5.0,
    )
    db.add(pos)
    with pytest.raises(IntegrityError):
        db.commit()

def test_position_with_null_required_fields(db):
    user = create_test_user(db)

    pos = Position(
        user_id=user.id,
        symbol=None,  # symbol is required
        position_type=PositionType.SHORT,
        open_price=200.0,
        open_shares=2.0,
    )
    db.add(pos)
    with pytest.raises(IntegrityError):
        db.commit()
