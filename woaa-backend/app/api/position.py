"""
API routes for managing trading positions.
Includes endpoints for creating, updating, retrieving, and deleting positions.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.schemas import position as schemas
from app.services import position as service

router = APIRouter(prefix="/positions", tags=["pos"])


@router.post("/", response_model=schemas.PositionOut, status_code=status.HTTP_201_CREATED)
def create_position(position: schemas.PositionCreate, db: Session = Depends(get_db)):
    """
    Create a new trading position.

    Args:
        position: PositionCreate schema with new position data.
        db: SQLAlchemy session dependency.

    Returns:
        The created Position.
    """
    return service.create_position(db, position)


@router.get("/", response_model=List[schemas.PositionOut])
def get_all_positions(db: Session = Depends(get_db)):
    """
    Retrieve all positions.

    Args:
        db: SQLAlchemy session dependency.

    Returns:
        A list of all Position records.
    """
    return service.get_positions(db)


@router.get("/{position_id}", response_model=schemas.PositionOut)
def get_position(position_id: UUID, db: Session = Depends(get_db)):
    """
    Retrieve a position by ID.

    Args:
        position_id: UUID of the position.
        db: SQLAlchemy session dependency.

    Returns:
        The requested Position.
    """
    db_position = service.get_position_by_id(db, position_id)
    if not db_position:
        raise HTTPException(status_code=404, detail="Position not found")
    return db_position


@router.put("/{position_id}", response_model=schemas.PositionOut)
def update_position(position_id: UUID, updates: schemas.PositionUpdate, db: Session = Depends(get_db)):
    """
    Update an existing position.

    Args:
        position_id: UUID of the position to update.
        updates: PositionUpdate schema with updated fields.
        db: SQLAlchemy session dependency.

    Returns:
        The updated Position.
    """
    return service.update_position(db, position_id, updates)


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_position(position_id: UUID, db: Session = Depends(get_db)):
    """
    Delete a position by ID.

    Args:
        position_id: UUID of the position to delete.
        db: SQLAlchemy session dependency.
    """
    service.delete_position(db, position_id)
