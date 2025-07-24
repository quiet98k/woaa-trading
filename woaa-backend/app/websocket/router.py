import json
import re
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from websocket.real_time_trades import alpaca_ws_manager

router = APIRouter()

VALID_SYMBOL_REGEX = re.compile(r"^[A-Z]{1,5}$")  # Simple US stock symbol format


@router.websocket("/ws/market")
async def market_ws(websocket: WebSocket):
    await websocket.accept()
    alpaca_ws_manager.register_client(websocket)
    alpaca_ws_manager.print_status()

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action")
            symbol = data.get("symbol")
            if action == "subscribe" and symbol:
                # if not VALID_SYMBOL_REGEX.match(symbol):
                #     await websocket.send_text(json.dumps({"error": "Invalid symbol"}))
                #     return
                await alpaca_ws_manager.subscribe_symbol(websocket, symbol)
                alpaca_ws_manager.print_status()
            elif action == "unsubscribe" and symbol:
                # if not VALID_SYMBOL_REGEX.match(symbol):
                #     await websocket.send_text(json.dumps({"error": "Invalid symbol"}))
                #     return
                await alpaca_ws_manager.unsubscribe_symbol(websocket, symbol)
                alpaca_ws_manager.print_status()
            elif action == "get_subscriptions":
                symbols = alpaca_ws_manager.get_my_subscribed_symbols(websocket)
                await websocket.send_text(json.dumps({
                    "type": "subscriptions",
                    "symbols": list(symbols)
                }))

    except WebSocketDisconnect:
        await alpaca_ws_manager.unregister_client(websocket)
        alpaca_ws_manager.print_status()

