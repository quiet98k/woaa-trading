"""
API routes for retrieving and writing logs.

Endpoints:
- POST /logs: Create a new log
- GET /logs/{user_id}: Retrieve all logs for a user
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.schemas.log import LogCreate, LogOut
from app.services import log as service
from app.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("/", response_model=LogOut)
def create_log_entry(log: LogCreate, db: Session = Depends(get_db)):
    """
    Create a new log entry.

    Args:
        log: LogCreate payload
        db: SQLAlchemy session

    Returns:
        LogOut
    """
    
    #TODO: testing
    
    return service.create_log(db, log)


@router.get("/{user_id}", response_model=List[LogOut])
def get_logs(user_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get all logs for a specific user.

    Args:
        user_id: UUID of user to query logs for
        db: SQLAlchemy session
        current_user: Authenticated user (required)

    Returns:
        List of logs
    """
    
    #TODO: testing
    
    return service.get_logs_by_user(db, user_id)
