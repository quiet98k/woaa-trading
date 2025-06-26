"""
API routes for retrieving and writing logs.

Endpoints:
- POST /logs: Create a new log entry
- GET /logs/me: Get logs for the authenticated user
- GET /logs/{user_id}: Admin-only access to any user's logs
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
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
async def create_log_entry(
    log: LogCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new log entry (user_id must be provided).
    """
    new_log = await service.create_log(db, log)
    await log_action(db, log.user_id, "manual_log", f"Created log manually: {log.action}")
    return new_log


@router.get("/me", response_model=List[LogOut])
async def get_own_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve logs for the currently authenticated user.
    """
    logs = await service.get_logs_by_user(db, current_user.id)
    await log_action(db, current_user.id, "view_logs", "User viewed their own logs.")
    return logs


@router.get("/{user_id}", response_model=List[LogOut])
async def get_logs_by_user_id(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Admin-only: Get all logs for a specific user.
    """
    logs = await service.get_logs_by_user(db, user_id)
    await log_action(db, admin_user.id, "admin_view_logs", f"Viewed logs for user {user_id}")
    return logs
