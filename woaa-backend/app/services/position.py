"""
Service functions for Position model.
Implements business logic for CRUD operations on positions.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from fastapi import HTTPException

from app.models.position import Position
from app.schemas.position import PositionCreate, PositionUpdate
from typing import List, Optional


async def create_position(db: AsyncSession, user_id: UUID, position: PositionCreate) -> Position:
    db_position = Position(**position.model_dump(), user_id=user_id)
    db.add(db_position)
    await db.commit()
    await db.refresh(db_position)
    return db_position


async def get_positions_by_user(db: AsyncSession, user_id: UUID) -> List[Position]:
    result = await db.execute(select(Position).where(Position.user_id == user_id))
    return result.scalars().all()


async def get_positions(db: AsyncSession) -> List[Position]:
    result = await db.execute(select(Position))
    return result.scalars().all()


async def get_position_by_id(db: AsyncSession, position_id: UUID) -> Optional[Position]:
    result = await db.execute(select(Position).where(Position.id == position_id))
    return result.scalar_one_or_none()


async def update_position(db: AsyncSession, position_id: UUID, updates: PositionUpdate) -> Position:
    db_position = await get_position_by_id(db, position_id)
    if not db_position:
        raise HTTPException(status_code=404, detail="Position not found")

    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_position, key, value)

    await db.commit()
    await db.refresh(db_position)
    return db_position


async def delete_position(db: AsyncSession, position_id: UUID) -> None:
    db_position = await get_position_by_id(db, position_id)
    if not db_position:
        raise HTTPException(status_code=404, detail="Position not found")

    await db.delete(db_position)
    await db.commit()
