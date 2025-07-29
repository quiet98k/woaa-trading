# app/api/log.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.services.log import save_log

router = APIRouter(prefix="/log", tags=["Logs"])

class LogEntry(BaseModel):
    timestamp: str
    log_id: str
    device: str
    user_name: str
    level: str
    event_type: str
    status: str
    error_msg: str | None
    location: str
    additional_info: dict

@router.post("")
async def receive_log(entry: LogEntry):
    await save_log(entry.dict())
    return {"status": "ok"}
