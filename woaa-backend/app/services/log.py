"""
Service functions for managing logs.
Handles creation and retrieval of user logs.
"""

from sqlalchemy.orm import Session
from uuid import UUID

from app.models.log import Log
from app.schemas.log import LogCreate


def create_log(db: Session, log_data: LogCreate) -> Log:
    """
    Create a new log entry.

    Args:
        db: Database session
        log_data: Data for the new log

    Returns:
        Log instance
    """
    
    #TODO: testing
    
    log = Log(**log_data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_logs_by_user(db: Session, user_id: UUID) -> list[Log]:
    """
    Retrieve all logs for a specific user.

    Args:
        db: Database session
        user_id: UUID of user

    Returns:
        List of Log objects
    """
    
    #TODO: testing
    
    return db.query(Log).filter(Log.user_id == user_id).order_by(Log.timestamp.desc()).all()

async def log_action(db: Session, user_id: UUID, action: str, details: str) -> None:
    """
    Utility to quickly log a user action.

    Args:
        db: Database session.
        user_id: UUID of user performing the action.
        action: Short action label (e.g. "login", "register").
        details: Freeform log details.
    """
    
    #TODO: testing
    
    log = Log(user_id=user_id, action=action, details=details)
    db.add(log)
    await db.commit()
