import pytest
from uuid import uuid4
from datetime import datetime
from pydantic import ValidationError
from app.schemas.position import (
    PositionCreate,
    PositionUpdate,
    PositionOut
)

def test_valid_position_create():
    position = PositionCreate(
        user_id=uuid4(),
        symbol="TSLA",
        position_type="Long",
        open_price=300.5,
        open_shares=12
    )
    assert position.symbol == "TSLA"
    assert position.position_type == "Long"

def test_invalid_position_type():
    with pytest.raises(ValidationError):
        PositionCreate(
            user_id=uuid4(),
            symbol="TSLA",
            position_type="HOLD",  # Invalid
            open_price=300.5,
            open_shares=12
        )

def test_position_update_partial_fields():
    update = PositionUpdate(
        close_price=350.0,
        close_shares=12,
        realized_pl=600.0,
        status="closed"
    )
    assert update.status == "closed"

def test_position_update_invalid_status():
    with pytest.raises(ValidationError):
        PositionUpdate(status="not-a-status")

def test_position_out_serialization():
    output = PositionOut(
        id=uuid4(),
        user_id=uuid4(),
        symbol="MSFT",
        position_type="Short",
        open_price=250.0,
        open_shares=3.0,
        open_time=datetime.utcnow(),
        close_price=None,
        close_shares=None,
        close_time=None,
        realized_pl=0.0,
        status="open"
    )
    assert output.symbol == "MSFT"
