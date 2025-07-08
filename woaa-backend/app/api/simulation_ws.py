from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.auth import get_current_user_ws
from app.database import async_session_maker
from app.models.user_setting import UserSetting
from sqlalchemy.future import select
import json
import asyncio

router = APIRouter()

@router.websocket("/ws/simulation/time")
async def stream_sim_time(websocket: WebSocket):
    print("hahaha")
    user = None
    try:
        # Authenticate user before accepting connection
        user = await get_current_user_ws(websocket)
        await websocket.accept()
        
        while True:
            try:
                async with async_session_maker() as session:
                    result = await session.execute(
                        select(UserSetting.sim_time).where(UserSetting.user_id == user.id)
                    )
                    sim_time = result.scalar_one_or_none()

                if sim_time is None:
                    await websocket.send_text(json.dumps({"error": "No sim_time found"}))
                else:
                    await websocket.send_text(json.dumps({"sim_time": sim_time.isoformat()}))

                await asyncio.sleep(1)  # stream every second
                
            except Exception as e:
                print(f"[WebSocket] Database error for user_id={user.id}: {e}")
                await websocket.send_text(json.dumps({"error": "Database error"}))
                await asyncio.sleep(1)  # continue after error

    except WebSocketDisconnect:
        print(f"[WebSocket] Disconnected: user_id={getattr(user, 'id', 'unknown')}")
    except Exception as e:
        print(f"[WebSocket] Authentication or connection error: {e}")
        try:
            await websocket.close(code=1008)  # Policy violation
        except Exception:
            pass  # Connection might already be closed
