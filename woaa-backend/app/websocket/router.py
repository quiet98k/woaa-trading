from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.real_time_data_ws import alpaca_ws_manager

router = APIRouter()

@router.websocket("/ws/market")
async def market_ws(websocket: WebSocket):
    await websocket.accept()
    alpaca_ws_manager.register_client(websocket)

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            symbol = data.get("symbol")
            if action == "subscribe" and symbol:
                await alpaca_ws_manager.subscribe_symbol(websocket, symbol)
                alpaca_ws_manager.print_status()

    except WebSocketDisconnect:
        await alpaca_ws_manager.unregister_client(websocket)
        alpaca_ws_manager.print_status()

