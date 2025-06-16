import uuid
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.log import Log

def create_log_user(db):
    user = User(
        id=uuid.uuid4(),
        username=f"log_user_{uuid.uuid4().hex[:6]}",
        email=f"log_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="pass"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def test_create_valid_log(db):
    user = create_log_user(db)

    log = Log(
        user_id=user.id,
        action="login",
        details="User logged in from IP 127.0.0.1"
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    assert log.id is not None
    assert log.action == "login"
    assert "127.0.0.1" in log.details
    assert log.timestamp is not None

def test_log_without_user_fails(db):
    log = Log(
        user_id=None,
        action="unauthorized",
        details="Missing user"
    )
    db.add(log)
    with pytest.raises(IntegrityError):
        db.commit()

def test_log_with_missing_action_fails(db):
    user = create_log_user(db)

    log = Log(
        user_id=user.id,
        action=None,  # required
        details="missing action"
    )
    db.add(log)
    with pytest.raises(IntegrityError):
        db.commit()

def test_update_log_details(db):
    user = create_log_user(db)

    log = Log(user_id=user.id, action="login", details="old details")
    db.add(log)
    db.commit()
    db.refresh(log)

    log.details = "new details"
    db.commit()
    db.refresh(log)

    assert log.details == "new details"