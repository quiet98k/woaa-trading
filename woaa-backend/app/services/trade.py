# app/services/trade.py

from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from uuid import UUID

from app.services.user_setting import get_user_setting
from app.services.transaction import create_transaction
from app.services.position import create_position, get_position_by_id, update_position
from app.schemas.transaction import TransactionCreate
from app.schemas.position import PositionCreate, PositionUpdate
from app.models.user import User


async def create_trade_service(
    db: AsyncSession,
    user_id: UUID,
    trade_data: dict
):
    """
    Creates a trade:
    - Validates user & balances
    - Uses fixed commission from user settings
    - Creates a transaction & position
    - Updates balances
    - Returns transaction, position, and updated balances
    """

    # 1️⃣ Get user
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2️⃣ Get user settings (for commission info)
    settings = await get_user_setting(db, user_id)
    if not settings:
        raise HTTPException(status_code=400, detail="User settings not found")

    # 3️⃣ Extract required trade data
    try:
        symbol = trade_data["symbol"]
        shares = trade_data["shares"]
        price = trade_data["price"]
        action = trade_data["action"]  # "buy" or "short"
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing field: {e.args[0]}")

    # 4️⃣ Commission is fixed
    commission = round(settings.commission_rate, 2)

    sim_commission = commission if settings.commission_type == "sim" else 0
    real_commission = commission if settings.commission_type == "real" else 0

    # 5️⃣ Calculate balance changes
    base_cost = shares * price
    total_sim_cost = -base_cost if action == "buy" else base_cost

    new_sim_balance = round((user.sim_balance or 0) + total_sim_cost - sim_commission, 2)
    new_real_balance = round((user.real_balance or 0) - real_commission, 2)

    if new_sim_balance < 0:
        raise HTTPException(status_code=400, detail="Insufficient simulated balance (including commission).")
    if new_real_balance < 0:
        raise HTTPException(status_code=400, detail="Insufficient real balance to cover commission.")

    # 6️⃣ Create transaction
    transaction_payload = TransactionCreate(
        symbol=symbol,
        shares=shares,
        price=price,
        commission_charged=commission,
        action=action,
        commission_type=settings.commission_type,
        notes=trade_data.get("notes", "")
    )

    transaction = await create_transaction(
        db=db,
        tx_data=transaction_payload,
        user_id=user_id
    )

    # 7️⃣ Create position
    position_payload = PositionCreate(
        symbol=symbol,
        position_type="Long" if action == "buy" else "Short",
        open_price=price,
        open_shares=shares
    )

    position = await create_position(
        db=db,
        user_id=user_id,
        position=position_payload
    )

    # 8️⃣ Update balances
    user.sim_balance = new_sim_balance
    user.real_balance = new_real_balance
    db.add(user)

    await db.commit()
    await db.refresh(user)

    return {
        "transaction": transaction,
        "position": position,
        "updated_balances": {
            "sim_balance": new_sim_balance,
            "real_balance": new_real_balance
        }
    }


async def close_trade_service(
    db: AsyncSession,
    user_id: UUID,
    position_id: UUID,
    current_price: float,
    notes: str = "",
):
    """
    Close an open position using service helpers.
    IMPORTANT: We assume create_transaction() DOES NOT modify balances.
               We compute and apply ALL balance changes here.

    Steps:
      1) Load user + settings
      2) Load position and verify ownership/status
      3) Create closing transaction (sell for Long, cover for Short)
      4) Apply proceeds and commission to balances HERE (not in create_transaction)
      5) Update position close fields via update_position()
      6) Return transaction, position, and updated balances
    """

    # 1) Load user
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2) Load settings (fixed commission + commission_type)
    settings = await get_user_setting(db, user_id)
    if not settings:
        raise HTTPException(status_code=400, detail="User settings not found")

    commission = round(float(settings.commission_rate), 2)

    # 3) Load position and validate
    position = await get_position_by_id(db, position_id)
    if not position or position.user_id != user_id:
        raise HTTPException(status_code=404, detail="Position not found or unauthorized")
    if position.status != "open":
        raise HTTPException(status_code=400, detail="Position already closed")

    symbol = position.symbol
    shares = float(position.open_shares)
    open_price = float(position.open_price)
    is_long = position.position_type == "Long"

    # 4) Create closing transaction (this function should NOT change balances)
    closing_action = "sell" if is_long else "cover"
    tx_payload = TransactionCreate(
        symbol=symbol,
        shares=shares,
        price=current_price,
        commission_charged=commission,
        action=closing_action,
        commission_type=settings.commission_type,
        notes=notes or "",
    )
    transaction = await create_transaction(db=db, tx_data=tx_payload, user_id=user_id)
    # NOTE: create_transaction commits internally in your current service.
    # If you want atomicity later, consider refactoring to share one session/commit.

    # 5) Manually compute and apply balance changes here
    #    Gross proceeds convention (matches your prior frontend logic):
    #      - Long close (sell):  +current_price * shares
    #      - Short close (cover): -current_price * shares  (outflow)
    gross_proceeds = (current_price * shares) if is_long else (-current_price * shares)

    new_sim = (user.sim_balance or 0.0) + gross_proceeds
    new_real = (user.real_balance or 0.0)

    if settings.commission_type == "sim":
        new_sim -= commission
    else:
        new_real -= commission

    # Guard rails: do not allow negatives
    if new_real < 0:
        raise HTTPException(status_code=400, detail="Insufficient real balance to cover commission.")
    if new_sim < 0:
        raise HTTPException(status_code=400, detail="Insufficient simulated balance after closing trade.")

    user.sim_balance = round(new_sim, 2)
    user.real_balance = round(new_real, 2)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 6) Update position close fields and realized P&L
    realized_pl = (current_price - open_price) * (shares if is_long else -shares)
    pos_updates = PositionUpdate(
        close_price=current_price,
        close_shares=shares,
        close_time=datetime.now(timezone.utc),
        realized_pl=realized_pl,
        status="closed",
    )
    position = await update_position(db=db, position_id=position_id, updates=pos_updates)

    return {
        "transaction": transaction,
        "position": position,
        "updated_balances": {
            "sim_balance": user.sim_balance,
            "real_balance": user.real_balance,
        },
    }
