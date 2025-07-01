import uuid
import pytest
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.user_setting import UserSetting, SettingType

def create_setting_user(db):
    user = User(
        id=uuid.uuid4(),
        username=f"set_user_{uuid.uuid4().hex[:6]}",
        email=f"set_{uuid.uuid4().hex[:6]}@example.com",
        hashed_password="pass"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def test_create_valid_user_setting(db):
    user = create_setting_user(db)

    setting = UserSetting(
        user_id=user.id,
        commission_rate=0.001,
        initial_sim_balance=10000,
        commission_type=SettingType.REAL,
        holding_cost_rate=0.002,
        holding_cost_type=SettingType.REAL,
        margin_limit=0.05,
        margin_type=SettingType.SIM,
        overnight_fee_rate=0.01,
        overnight_fee_type=SettingType.SIM,
        gain_rate_threshold=0.5,
        drawdown_rate_threshold=0.25,
        power_up_fee=5.0,
        power_up_type=SettingType.REAL,
    )
    db.add(setting)
    db.commit()
    db.refresh(setting)

    assert setting.commission_rate == 0.001
    assert setting.initial_sim_balance == 10000
    assert setting.drawdown_rate_threshold == 0.25
    assert setting.updated_at is not None

def test_duplicate_user_setting_fails(db):
    user = create_setting_user(db)

    setting1 = UserSetting(user_id=user.id)
    setting2 = UserSetting(user_id=user.id)

    db.add(setting1)
    db.commit()
    db.add(setting2)
    
    with pytest.raises(IntegrityError):
        db.commit()

def test_user_setting_without_user_fails(db):
    setting = UserSetting(user_id=None)
    db.add(setting)
    with pytest.raises(IntegrityError):
        db.commit()

def test_update_user_setting_commission_rate(db):
    user = create_setting_user(db)

    setting = UserSetting(user_id=user.id, commission_rate=0.001, commission_type=SettingType.REAL)
    db.add(setting)
    db.commit()
    db.refresh(setting)

    original_updated = setting.updated_at
    setting.commission_rate = 0.002
    db.commit()
    db.refresh(setting)

    assert setting.commission_rate == 0.002
    assert setting.updated_at >= original_updated