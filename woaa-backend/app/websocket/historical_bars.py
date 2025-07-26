from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.auth import get_current_user_ws
from app.database import async_session_maker
from app.models.user_setting import UserSetting
from sqlalchemy.future import select
from app.services.alpaca import fetch_bars_from_alpaca

import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict

router = APIRouter()


@router.websocket("/ws/data/historical_bars")
async def stream_historical_bars(websocket: WebSocket):
    await websocket.accept()
    user = None
    try:
        user = await get_current_user_ws(websocket)
        print(f"[WebSocket] User {user.id} connected to historical bars stream")

        subscribed_symbols: Dict[str, datetime] = {}

        while True:
            try:
                if websocket.client_state.name == "CONNECTED":
                    message = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                    data = json.loads(message)
                    action = data.get("action")
                    symbol = data.get("symbol", "").upper().strip()

                    if action == "subscribe" and symbol:
                        if symbol not in subscribed_symbols:
                            subscribed_symbols[symbol] = None
                            await websocket.send_json({"info": f"Subscribed to {symbol}"})
                    elif action == "unsubscribe" and symbol:
                        if symbol in subscribed_symbols:
                            subscribed_symbols.pop(symbol)
                            await websocket.send_json({"info": f"Unsubscribed from {symbol}"})
            except asyncio.TimeoutError:
                pass  # Allow time to fetch sim_time

            if not subscribed_symbols:
                await asyncio.sleep(1)
                continue

            async with async_session_maker() as session:
                result = await session.execute(
                    select(UserSetting.sim_time).where(UserSetting.user_id == user.id)
                )
                sim_time: datetime = result.scalar_one_or_none()

            if sim_time is None:
                await websocket.send_json({"error": "No sim_time found"})
                await asyncio.sleep(1)
                continue

            for symbol, last_sent_time in subscribed_symbols.items():
                start = sim_time if last_sent_time is None else last_sent_time + timedelta(minutes=1)
                if start > sim_time:
                    continue  # No new data needed

                bars = await fetch_bars_from_alpaca(
                    symbol=symbol,
                    start=start.isoformat(),
                    end=sim_time.isoformat(),
                    timeframe="1Min",
                    limit=1000,
                    sort="asc"
                )

                if symbol in bars and bars[symbol]:
                    await websocket.send_json({
                        "symbol": symbol,
                        "bars": bars[symbol]
                    })

                    last_timestamp = bars[symbol][-1]["t"]
                    subscribed_symbols[symbol] = datetime.fromisoformat(last_timestamp)

            await asyncio.sleep(1.3)

    except WebSocketDisconnect:
        print(f"[WebSocket] Disconnected: user_id={getattr(user, 'id', 'unknown')}")
    except Exception as e:
        print(f"[WebSocket] Error: {e}")
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
