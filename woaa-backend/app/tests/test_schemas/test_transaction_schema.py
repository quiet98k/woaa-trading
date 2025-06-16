import pytest
from uuid import uuid4
from datetime import datetime
from pydantic import ValidationError
from app.schemas.transaction import (
    TransactionCreate,
    TransactionUpdate,
    TransactionOut
)

def test_valid_transaction_create():
    tx = TransactionCreate(
        user_id=uuid4(),
        symbol="AAPL",
        shares=10.0,
        price=170.0,
        action="buy",
        commission_charged=2.0,
        commission_type="real",
        notes="first trade"
    )
    assert tx.action == "buy"
    assert tx.commission_type == "real"

@pytest.mark.parametrize(
    "invalid_fields",
    [
        {"action": "hold"},
        {"commission_type": "invalid"},
    ],
)
def test_transaction_create_invalid_inputs(invalid_fields):
    base_kwargs = {
        "user_id": uuid4(),
        "symbol": "AAPL",
        "shares": 10.0,
        "price": 170.0,
        "action": "buy",
        "commission_charged": 2.0,
        "commission_type": "real",
    }
    base_kwargs.update(invalid_fields)
    with pytest.raises(ValidationError):
        TransactionCreate(**base_kwargs)

def test_transaction_update_only_notes():
    tx_update = TransactionUpdate(notes="updated note")
    assert tx_update.notes == "updated note"

def test_transaction_out_serialization():
    tx_out = TransactionOut(
        id=uuid4(),
        user_id=uuid4(),
        symbol="TSLA",
        shares=7,
        price=900.0,
        action="sell",
        commission_charged=5.0,
        commission_type="sim",
        timestamp=datetime.utcnow(),
        notes=None
    )
    assert tx_out.symbol == "TSLA"
