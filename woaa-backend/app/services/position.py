"""
Service functions for Position model.
Implements business logic for CRUD operations on positions.
"""

from sqlalchemy.orm import Session
from uuid import UUID
from fastapi import HTTPException, status

from app.models.position import Position
from app.schemas.position import PositionCreate, PositionUpdate


def create_position(db: Session, position: PositionCreate) -> Position:
    """
    Create and save a new Position.

    Args:
        db: SQLAlchemy session.
        position: Data to create the Position.

    Returns:
        The created Position object.
    """
    db_position = Position(**position.model_dump())
    db.add(db_position)
    db.commit()
    db.refresh(db_position)
    return db_position


def get_positions(db: Session) -> list[Position]:
    """
    Retrieve all positions from the database.

    Args:
        db: SQLAlchemy session.

    Returns:
        List of all Position objects.
    """
    return db.query(Position).all()


def get_position_by_id(db: Session, position_id: UUID) -> Position | None:
    """
    Retrieve a position by its ID.

    Args:
        db: SQLAlchemy session.
        position_id: UUID of the position.

    Returns:
        The Position object if found, else None.
    """
    return db.query(Position).filter(Position.id == position_id).first()


def update_position(db: Session, position_id: UUID, updates: PositionUpdate) -> Position:
    """
    Update a position by ID.

    Args:
        db: SQLAlchemy session.
        position_id: UUID of the position.
        updates: Fields to update.

    Returns:
        The updated Position object.

    Raises:
        HTTPException: If position not found.
    """
    db_position = get_position_by_id(db, position_id)
    if not db_position:
        raise HTTPException(status_code=404, detail="Position not found")

    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(db_position, key, value)

    db.commit()
    db.refresh(db_position)
    return db_position


def delete_position(db: Session, position_id: UUID) -> None:
    """
    Delete a position by its ID.

    Args:
        db: SQLAlchemy session.
        position_id: UUID of the position.

    Raises:
        HTTPException: If position not found.
    """
    db_position = get_position_by_id(db, position_id)
    if not db_position:
        raise HTTPException(status_code=404, detail="Position not found")

    db.delete(db_position)
    db.commit()
