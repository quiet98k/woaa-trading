import uuid
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.user import User

def test_create_valid_user(db):
    """
    Ensure a User is created with valid fields.
    """
    user = User(
        id=uuid.uuid4(),
        username="validuser",
        email="valid@example.com",
        hashed_password="hashed123"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    assert user.id is not None
    assert user.username == "validuser"
    assert user.email == "valid@example.com"
    assert user.real_balance == 0.0
    assert user.sim_balance == 0.0
    assert user.is_admin is False

def test_duplicate_username_raises_error(db):
    """
    Creating users with duplicate username should fail.
    """
    user1 = User(
        id=uuid.uuid4(),
        username="duplicate",
        email="unique1@example.com",
        hashed_password="pass"
    )
    user2 = User(
        id=uuid.uuid4(),
        username="duplicate",  # same username
        email="unique2@example.com",
        hashed_password="pass"
    )

    db.add(user1)
    db.commit()
    db.add(user2)

    with pytest.raises(IntegrityError):
        db.commit()

def test_duplicate_email_raises_error(db):
    """
    Creating users with duplicate email should fail.
    """
    user1 = User(
        id=uuid.uuid4(),
        username="uniqueuser1",
        email="dupe@example.com",
        hashed_password="pass"
    )
    user2 = User(
        id=uuid.uuid4(),
        username="uniqueuser2",
        email="dupe@example.com",  # same email
        hashed_password="pass"
    )

    db.add(user1)
    db.commit()
    db.add(user2)

    with pytest.raises(IntegrityError):
        db.commit()

def test_null_username_raises_error(db):
    """
    Username is non-nullable, should raise error.
    """
    user = User(
        id=uuid.uuid4(),
        username=None,  # null username
        email="nulluser@example.com",
        hashed_password="pass"
    )
    db.add(user)
    with pytest.raises(IntegrityError):
        db.commit()
