from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends
from uuid import UUID
from app.services.sim_ws import sim_time_manager
from app.auth import get_current_user_ws
from app.models.user import User

router = APIRouter()


@router.websocket("/ws/sim-time")
async def sim_time_ws(websocket: WebSocket, user: User = Depends(get_current_user_ws)):
    """
    WebSocket for pushing sim_time updates to the frontend.
    """
    await sim_time_manager.connect(user.id, websocket)
    try:
        while True:
            await websocket.receive_text()  # keeps connection alive
    except WebSocketDisconnect:
        sim_time_manager.disconnect(user.id)
