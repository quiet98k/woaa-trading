"""
@fileoverview Handles [resource] endpoints (e.g., user, auth, trade).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user  # if auth-protected


router = APIRouter()

#TODO: Implement
#TODO: loging
#TODO: testing