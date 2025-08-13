# app/api/trade.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User

from app.services.trade import close_trade_service, create_trade_service  # ✅ import service

router = APIRouter(prefix="/trades", tags=["trades"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_trade(
    payload: dict,  # Expected keys:
                    # {
                    #   "symbol": str,          # Stock ticker, e.g. "AAPL"
                    #   "shares": float,        # Number of shares (> 0)
                    #   "price": float,         # Trade price per share (> 0)
                    #   "action": "buy" | "short",  # Trade direction
                    #   "notes": str (optional) # Optional trade notes
                    # }
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create (open) a trade for the authenticated user.
    """
    return await create_trade_service(
        db=db,
        user_id=current_user.id,
        trade_data=payload
    )


@router.post("/item/{position_id}/close", status_code=status.HTTP_200_OK)
async def close_trade(
    position_id: UUID,
    payload: dict,  # Expected keys:
                    # {
                    #   "current_price": float,   # required, > 0
                    #   "notes": str (optional)   # optional notes
                    # }
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Close an existing open position belonging to the authenticated user."""
    # Minimal inline validation since we're not using a schema
    if "current_price" not in payload:
        raise HTTPException(status_code=400, detail="Missing field: current_price")
    current_price = payload["current_price"]
    if not isinstance(current_price, (int, float)) or current_price <= 0:
        raise HTTPException(status_code=400, detail="current_price must be a positive number")

    notes = payload.get("notes", "")

    return await close_trade_service(
        db=db,
        user_id=current_user.id,
        position_id=position_id,
        current_price=float(current_price),
        notes=notes,
    )


@router.delete("/item/{trade_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trade(
    trade_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a trade owned by the authenticated user.
    """
    # TODO: implement delete trade logic
    # - verify ownership/authorization
    # - ensure business rules allow deletion (e.g., only if not settled)
    # - perform deletion
    # - return 204 on success
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")
