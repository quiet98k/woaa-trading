"""
API routes for retrieving and writing logs.

Endpoints:
- POST /logs: Create a new log entry
- GET /logs/me: Get logs for the authenticated user
- GET /logs/{user_id}: Admin-only access to any user's logs
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.schemas.log import LogCreate, LogOut
from app.services import log as service
from app.auth import get_current_user, get_current_admin_user
from app.models.user import User
from app.services.log import log_action

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("/", response_model=LogOut)
def create_log_entry(log: LogCreate, db: Session = Depends(get_db)):
    """
    Create a new log entry.

    Args:
        log: LogCreate payload (user_id must be provided)
        db: SQLAlchemy session

    Returns:
        LogOut: Created log entry
    """
    new_log = service.create_log(db, log)
    log_action(db, log.user_id, "manual_log", f"Created log manually: {log.action}")
    return new_log


@router.get("/me", response_model=List[LogOut])
def get_own_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Retrieve logs for the currently authenticated user.

    Args:
        db: SQLAlchemy session
        current_user: Authenticated user

    Returns:
        List of LogOut
    """
    logs = service.get_logs_by_user(db, current_user.id)
    log_action(db, current_user.id, "view_logs", "User viewed their own logs.")
    return logs


@router.get("/{user_id}", response_model=List[LogOut])
def get_logs_by_user_id(
    user_id: UUID,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Admin-only: Get all logs for a specific user.

    Args:
        user_id: UUID of the user whose logs are requested
        db: SQLAlchemy session
        admin_user: Authenticated admin user

    Returns:
        List of LogOut
    """
    logs = service.get_logs_by_user(db, user_id)
    log_action(db, admin_user.id, "admin_view_logs", f"Viewed logs for user {user_id}")
    return logs
