import pytest
from uuid import uuid4
from datetime import datetime
from pydantic import ValidationError
from app.schemas.log import LogCreate, LogOut

def test_valid_log_create():
    log = LogCreate(
        user_id=uuid4(),
        action="update_settings",
        details="Admin changed margin rate"
    )
    assert log.action == "update_settings"
    assert "margin" in log.details

def test_missing_details_fails():
    with pytest.raises(ValidationError):
        LogCreate(
            user_id=uuid4(),
            action="update_settings"
            # missing details
        )

def test_log_out_serialization():
    log = LogOut(
        id=uuid4(),
        user_id=uuid4(),
        action="trade",
        details="User executed a buy order",
        timestamp=datetime.utcnow()
    )
    assert log.action == "trade"
    assert "buy" in log.details
