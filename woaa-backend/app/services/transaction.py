"""
Service functions for business logic related to transactions.
Handles CRUD operations and interaction with the database.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from fastapi import HTTPException
from typing import List, Optional

from app.models.transaction import Transaction
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionUpdate


async def create_transaction(db: AsyncSession, tx_data: TransactionCreate, user_id: UUID) -> Transaction:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    total_cost = tx_data.price * tx_data.shares

    if tx_data.action in {"buy", "cover"}:
        if user.sim_balance < total_cost:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient simulated funds: need ${total_cost:.2f}, have ${user.sim_balance:.2f}"
            )
        user.sim_balance -= total_cost
        db.add(user)

    transaction = Transaction(**tx_data.model_dump(), user_id=user_id)
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    await db.refresh(user)

    return transaction


async def get_transaction_by_id(db: AsyncSession, tx_id: UUID) -> Optional[Transaction]:
    result = await db.execute(select(Transaction).where(Transaction.id == tx_id))
    return result.scalar_one_or_none()


async def get_user_transactions(db: AsyncSession, user_id: UUID) -> List[Transaction]:
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.timestamp.desc())
    )
    return result.scalars().all()


async def update_transaction(db: AsyncSession, tx_id: UUID, updates: TransactionUpdate) -> Transaction:
    tx = await get_transaction_by_id(db, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(tx, key, value)

    await db.commit()
    await db.refresh(tx)
    return tx


async def delete_transaction(db: AsyncSession, tx_id: UUID) -> None:
    tx = await get_transaction_by_id(db, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    await db.delete(tx)
    await db.commit()
