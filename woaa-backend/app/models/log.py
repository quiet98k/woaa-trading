"""
Defines the SQLAlchemy model for system logs.
Used to store user-related events and actions for auditing and debugging.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.database import Base


class Log(Base):
    """
    SQLAlchemy model representing an application log entry.

    Fields:
        - id: Primary key (UUID)
        - user_id: Foreign key referencing the user
        - action: Type of action (e.g., login, trade, update)
        - details: Textual description of the event
        - timestamp: Time when the log entry was created
    """
    
    
    __tablename__ = "logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
