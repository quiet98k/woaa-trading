# app/services/trade.py

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from uuid import UUID

from app.services.user_setting import get_user_setting
from app.services.transaction import create_transaction
from app.services.position import create_position
from app.schemas.transaction import TransactionCreate
from app.schemas.position import PositionCreate
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
