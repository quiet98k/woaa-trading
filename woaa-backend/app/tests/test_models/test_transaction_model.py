import uuid
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.transaction import Transaction, ActionType, CommissionType

def create_transaction_user(db):
    user = User(
        id=uuid.uuid4(),
        username=f"tx_user_{uuid.uuid4().hex[:6]}",
        email=f"tx_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="pass"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def test_create_valid_transaction(db):
    user = create_transaction_user(db)

    tx = Transaction(
        user_id=user.id,
        symbol="GOOG",
        shares=5.0,
        price=2500.0,
        action=ActionType.BUY,
        commission_charged=10.0,
        commission_type=CommissionType.REAL,
        notes="initial purchase"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    assert tx.symbol == "GOOG"
    assert tx.action == ActionType.BUY
    assert tx.commission_charged == 10.0
    assert tx.notes == "initial purchase"
    assert tx.timestamp is not None

def test_transaction_missing_required_fields_fails(db):
    user = create_transaction_user(db)

    tx = Transaction(
        user_id=user.id,
        symbol=None,  # required
        shares=5.0,
        price=100.0,
        action=ActionType.SELL,
        commission_charged=0.0,
        commission_type=CommissionType.SIM
    )
    db.add(tx)
    with pytest.raises(IntegrityError):
        db.commit()

def test_transaction_without_user_fails(db):
    tx = Transaction(
        user_id=None,
        symbol="MSFT",
        shares=10,
        price=300.0,
        action=ActionType.SHORT,
        commission_charged=0.0,
        commission_type=CommissionType.REAL
    )
    db.add(tx)
    with pytest.raises(IntegrityError):
        db.commit()

def test_update_transaction_notes(db):
    user = create_transaction_user(db)

    tx = Transaction(
        user_id=user.id,
        symbol="AMZN",
        shares=2.0,
        price=3300.0,
        action=ActionType.BUY,
        commission_charged=0.0,
        commission_type=CommissionType.REAL,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    tx.notes = "updated note"
    db.commit()
    db.refresh(tx)

    assert tx.notes == "updated note"