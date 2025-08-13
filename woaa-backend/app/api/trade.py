# app/api/trade.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User

from app.services.trade import create_trade_service  # ✅ import service

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


@router.post("/item/{trade_id}/close", status_code=status.HTTP_200_OK)
async def close_trade(
    trade_id: UUID,
    payload: dict,  # TODO: replace dict with TradeCloseRequest schema
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Close an existing trade opened by the authenticated user.
    """
    # TODO: implement close trade logic
    # - verify ownership/authorization
    # - compute PnL, commission, balance updates
    # - update position status and create closing transaction
    # - return updated TradeOut
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Not implemented")


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
