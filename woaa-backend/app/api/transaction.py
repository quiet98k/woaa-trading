from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.database import get_db
from app.auth import get_current_user, get_current_admin_user
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionOut, TransactionUpdate
from app.services import transaction as service
from app.services.log import log_action

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.post("/", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    payload: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = await service.create_transaction(db, payload, current_user.id)
    await log_action(db, current_user.id, "create_transaction", f"Created transaction {tx.id} for {tx.symbol}")
    return tx


@router.get("/", response_model=List[TransactionOut])
async def get_my_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txs = await service.get_user_transactions(db, current_user.id)
    await log_action(db, current_user.id, "get_my_transactions", f"Retrieved {len(txs)} transactions")
    return txs


@router.get("/user/{user_id}", response_model=List[TransactionOut])
async def get_transactions_by_user_id(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    txs = await service.get_user_transactions(db, user_id)
    await log_action(db, admin_user.id, "admin_get_transactions", f"Fetched {len(txs)} transactions for user {user_id}")
    return txs


@router.get("/item/{tx_id}", response_model=TransactionOut)
async def get_transaction_by_id(
    tx_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    tx = await service.get_transaction_by_id(db, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    await log_action(db, admin_user.id, "admin_view_transaction", f"Viewed transaction {tx_id}")
    return tx


@router.put("/item/{tx_id}", response_model=TransactionOut)
async def update_transaction(
    tx_id: UUID,
    updates: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = await service.get_transaction_by_id(db, tx_id)
    if not tx or tx.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Transaction not found or unauthorized")

    updated_tx = await service.update_transaction(db, tx_id, updates)
    await log_action(db, current_user.id, "update_transaction", f"Updated transaction {tx_id}")
    return updated_tx


@router.delete("/item/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    tx_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = await service.get_transaction_by_id(db, tx_id)
    if not tx or tx.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Transaction not found or unauthorized")

    await service.delete_transaction(db, tx_id)
    await log_action(db, current_user.id, "delete_transaction", f"Deleted transaction {tx_id}")
