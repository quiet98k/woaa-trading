import pytest
from uuid import uuid4
from datetime import datetime
from pydantic import ValidationError
from app.schemas.user_setting import (
    UserSettingUpdate,
    UserSettingOut
)

def test_valid_user_setting_update():
    setting = UserSettingUpdate(
        commission_rate=0.002,
        commission_type="real",
        holding_cost_rate=0.003,
        holding_cost_type="sim",
        margin_limit=0.01,
        margin_type="real",
        overnight_fee_rate=0.004,
        overnight_fee_type="sim",
        gain_rate_threshold=0.4,
        drawdown_rate_threshold=0.2,
        power_up_fee=10.0,
        power_up_type="real"
    )
    assert setting.commission_rate == 0.002
    assert setting.drawdown_rate_threshold == 0.2

def test_invalid_setting_enum():
    with pytest.raises(ValidationError):
        UserSettingUpdate(
            commission_rate=0.002,
            commission_type="invalid",  # invalid enum
            holding_cost_rate=0.002,
            holding_cost_type="sim",
            margin_limit=0.01,
            margin_type="sim",
            overnight_fee_rate=0.01,
            overnight_fee_type="sim",
            gain_rate_threshold=0.5,
            drawdown_rate_threshold=0.25,
            power_up_fee=2.0,
            power_up_type="sim"
        )

def test_user_setting_out_serialization():
    data = UserSettingOut(
        user_id=uuid4(),
        commission_rate=0.002,
        commission_type="real",
        holding_cost_rate=0.003,
        holding_cost_type="sim",
        margin_limit=0.01,
        margin_type="real",
        overnight_fee_rate=0.004,
        overnight_fee_type="sim",
        gain_rate_threshold=0.4,
        drawdown_rate_threshold=0.2,
        power_up_fee=10.0,
        power_up_type="real",
        updated_at=datetime.utcnow()
    )
    assert data.margin_type == "real"
