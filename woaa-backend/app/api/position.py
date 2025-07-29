"""
API routes for managing trading positions.
Only authenticated users can access these endpoints, and users may only view or modify their own positions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.schemas import position as schemas
from app.services import position as service

router = APIRouter(prefix="/positions", tags=["position"])


@router.post("/", response_model=schemas.PositionOut, status_code=status.HTTP_201_CREATED)
async def create_position(
    position: schemas.PositionBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    created = await service.create_position(db, current_user.id, position)
    return created


@router.get("/", response_model=List[schemas.PositionOut])
async def get_my_positions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    positions = await service.get_positions_by_user(db, current_user.id)
    return positions


@router.get("/{position_id}", response_model=schemas.PositionOut)
async def get_position(
    position_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    position = await service.get_position_by_id(db, position_id)
    if not position or position.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Position not found or unauthorized")

    return position


@router.put("/{position_id}", response_model=schemas.PositionOut)
async def update_position(
    position_id: UUID,
    updates: schemas.PositionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    position = await service.get_position_by_id(db, position_id)
    if not position or position.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Position not found or unauthorized")

    updated = await service.update_position(db, position_id, updates)
    return updated


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_position(
    position_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    position = await service.get_position_by_id(db, position_id)
    if not position or position.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Position not found or unauthorized")

    await service.delete_position(db, position_id)
