"""
API routes for managing trading positions.
Only authenticated users can access these endpoints, and users may only view or modify their own positions.

Endpoints:
- POST /positions: Create a new position (auth required)
- GET /positions: Get all positions owned by current user
- GET /positions/{id}: Get a specific position by ID (must be owned)
- PUT /positions/{id}: Update a position (must be owned)
- DELETE /positions/{id}: Delete a position (must be owned)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.auth import get_current_user
from app.models.user import User
from app.schemas import position as schemas
from app.services import position as service
from app.services.log import log_action

router = APIRouter(prefix="/positions", tags=["position"])


@router.post("/", response_model=schemas.PositionOut, status_code=status.HTTP_201_CREATED)
def create_position(
    position: schemas.PositionBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new trading position for the authenticated user.

    Args:
        position (PositionBase): Position input fields.
        db (Session): Database session.
        current_user (User): Authenticated user from JWT token.

    Returns:
        PositionOut: The created position.
    """
    created = service.create_position(db, current_user.id, position)
    log_action(db, current_user.id, "create_position", f"Created position {created.id} ({created.symbol})")
    return created


@router.get("/", response_model=List[schemas.PositionOut])
def get_my_positions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve all positions owned by the authenticated user.

    Args:
        db (Session): Database session.
        current_user (User): Authenticated user.

    Returns:
        List[PositionOut]: All of the user’s positions.
    """
    positions = service.get_positions_by_user(db, current_user.id)
    log_action(db, current_user.id, "list_positions", f"Retrieved {len(positions)} positions")
    return positions


@router.get("/{position_id}", response_model=schemas.PositionOut)
def get_position(
    position_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve a specific position by ID (must be owned by current user).

    Args:
        position_id (UUID): ID of the position to fetch.
        db (Session): Database session.
        current_user (User): Authenticated user.

    Returns:
        PositionOut: The position if found and owned.

    Raises:
        HTTPException: If not found or not owned by user.
    """
    position = service.get_position_by_id(db, position_id)
    if not position or position.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Position not found or unauthorized")

    log_action(db, current_user.id, "view_position", f"Viewed position {position_id}")
    return position


@router.put("/{position_id}", response_model=schemas.PositionOut)
def update_position(
    position_id: UUID,
    updates: schemas.PositionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing position (must be owned by current user).

    Args:
        position_id (UUID): ID of the position to update.
        updates (PositionUpdate): Fields to update.
        db (Session): Database session.
        current_user (User): Authenticated user.

    Returns:
        PositionOut: Updated position data.

    Raises:
        HTTPException: If not found or not authorized.
    """
    position = service.get_position_by_id(db, position_id)
    if not position or position.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Position not found or unauthorized")

    updated = service.update_position(db, position_id, updates)
    log_action(db, current_user.id, "update_position", f"Updated position {position_id}")
    return updated


@router.delete("/{position_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_position(
    position_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a position (must be owned by current user).

    Args:
        position_id (UUID): ID of the position to delete.
        db (Session): Database session.
        current_user (User): Authenticated user.

    Raises:
        HTTPException: If not found or not authorized.
    """
    position = service.get_position_by_id(db, position_id)
    if not position or position.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Position not found or unauthorized")

    service.delete_position(db, position_id)
    log_action(db, current_user.id, "delete_position", f"Deleted position {position_id}")
