import os
import re
import json
import asyncio
import logging
import traceback
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import websockets
from websockets.exceptions import ConnectionClosed
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)  # Only affects this logger
    
    
ALPACA_URL = "wss://stream.data.alpaca.markets/v2/iex"
API_KEY = os.getenv("ALPACA_API_KEY")
API_SECRET = os.getenv("ALPACA_SECRET_KEY")

VALID_SYMBOL_REGEX = re.compile(r"^[A-Z]{1,5}$")

router = APIRouter()

class AlpacaWebSocketManager:
    def __init__(self):
        self.subscribers: dict[WebSocket, dict[str, set[str]]] = {} 
        self.symbols = {"trades": set(), "bars": set()}
        self.ws = None
        self.lock = asyncio.Lock()

    async def connect(self):
        logger.debug("🧭 connect() called. Caller stack:\n%s", "".join(traceback.format_stack(limit=5)))

        async with self.lock:
            if self.ws and self.ws.close_code is None:
                logger.debug("✅ Skipping connect — WebSocket is already open.")
                return

            logger.debug("🔌 Connecting to Alpaca WebSocket...")
            try:
                self.ws = await websockets.connect(ALPACA_URL)
                await self.ws.send(json.dumps({
                    "action": "auth",
                    "key": API_KEY,
                    "secret": API_SECRET
                }))
                resp = await self.ws.recv()
                logger.debug("Auth response: %s", resp)

                parsed = json.loads(resp)
                if isinstance(parsed, list):
                    for msg in parsed:
                        if msg.get("T") == "error":
                            logger.error("🚨 Alpaca WebSocket Error: %s", msg)
                            if msg.get("code") == 406:
                                logger.critical("🚫 Connection limit hit. Disabling reconnects.")
                                return  # Optional: set self.hard_error = True to block future calls

                for type_, symbol_set in self.symbols.items():
                    if symbol_set:
                        await self.ws.send(json.dumps({
                            "action": "subscribe",
                            type_: list(symbol_set)
                        }))
                        logger.debug(f"🔁 Resubscribed to {type_}: {symbol_set}")

                asyncio.create_task(self.receive_data())

            except Exception as e:
                logger.error("❌ Failed to connect to Alpaca WebSocket: %s", e)


    async def subscribe_symbol(self, websocket: WebSocket, symbol: str, type_: str = "trades"):  # 🆕
        if type_ not in {"trades", "bars"}:
            logger.warning("Invalid subscription type: %s", type_)
            return

        if websocket not in self.subscribers:
            self.subscribers[websocket] = {"trades": set(), "bars": set()}

        self.subscribers[websocket][type_].add(symbol)

        if symbol not in self.symbols[type_]:
            await self.ensure_ws()
            try:
                await self.ws.send(json.dumps({
                    "action": "subscribe",
                    type_: [symbol]
                }))
                self.symbols[type_].add(symbol)
                logger.debug(f"Subscribed to {type_}: {symbol}")
            except ConnectionClosed:
                logger.warning("Connection closed during subscribe to %s (%s), reconnecting...", symbol, type_)
                await self.reconnect_and_resubscribe()

    async def unsubscribe_symbol(self, websocket: WebSocket, symbol: str, type_: str = "trades"):  # 🆕
        if websocket in self.subscribers and symbol in self.subscribers[websocket].get(type_, set()):
            self.subscribers[websocket][type_].remove(symbol)

            still_used = any(
                symbol in other_subs.get(type_, set()) for other_subs in self.subscribers.values()
            )
            if not still_used:
                await self.ensure_ws()
                try:
                    await self.ws.send(json.dumps({
                        "action": "unsubscribe",
                        type_: [symbol]
                    }))
                    self.symbols[type_].discard(symbol)
                    logger.debug("Unsubscribed from %s (%s)", symbol, type_)
                except ConnectionClosed:
                    logger.warning("Connection closed during unsubscribe from %s (%s), reconnecting...", symbol, type_)
                    await self.reconnect_and_resubscribe()

    async def receive_data(self):
        try:
            async for message in self.ws:
                try:
                    data = json.loads(message)
                except json.JSONDecodeError:
                    logger.warning("Received non-JSON message: %s", message)
                    continue

                if isinstance(data, dict) and data.get("T") == "error":
                    logger.error("🚨 Alpaca WebSocket Error: %s", data)
                elif isinstance(data, list):
                    for item in data:
                        if item.get("T") == "error":
                            logger.error("🚨 Alpaca WebSocket Error: %s", item)

                disconnected = []
                for sub in self.subscribers:
                    try:
                        await sub.send_text(message)
                    except Exception:
                        disconnected.append(sub)
                for sub in disconnected:
                    await self.unregister_client(sub)
        except Exception as e:
            logger.debug("Error in receive loop: %s", e)
            await self.reconnect_and_resubscribe()

    async def ensure_ws(self):
        logger.debug("🛂 ensure_ws() called. WS = %s, closed = %s", self.ws, self.ws.close_code if self.ws else "None")
        if not self.ws or self.ws.close_code is not None:
            await self.connect()

    async def reconnect_and_resubscribe(self):
        logger.debug("🔁 reconnect_and_resubscribe() called")
        await self.connect()

    def register_client(self, websocket: WebSocket):
        self.subscribers[websocket] = {"trades": set(), "bars": set()}

    async def unregister_client(self, websocket: WebSocket):
        symbols_dict = self.subscribers.pop(websocket, {"trades": set(), "bars": set()})

        for type_ in ["trades", "bars"]:
            for symbol in symbols_dict.get(type_, set()):
                still_used = any(
                    symbol in other_subs.get(type_, set()) for other_subs in self.subscribers.values()
                )
                if not still_used:
                    await self.ensure_ws()
                    try:
                        await self.ws.send(json.dumps({
                            "action": "unsubscribe",
                            type_: [symbol]
                        }))
                        self.symbols[type_].discard(symbol)
                        logger.debug("Unsubscribed from %s (%s) during cleanup", symbol, type_)
                    except ConnectionClosed:
                        logger.warning("Connection closed during unsubscribe cleanup for %s (%s)", symbol, type_)

    def get_my_subscribed_symbols(self, websocket: WebSocket) -> dict[str, set[str]]:
        return self.subscribers.get(websocket, {"trades": set(), "bars": set()})

    def print_status(self):
        logger.debug("🔌 Connections: %d", len(self.subscribers))
        for type_ in ["trades", "bars"]:
            logger.debug(f"📈 Subscribed {type_}: {self.symbols[type_]}")
        for ws, symbol_dict in self.subscribers.items():
            logger.debug("  ↪️ Client %s -> trades: %s, bars: %s", id(ws), symbol_dict["trades"], symbol_dict["bars"])

alpaca_ws_manager = AlpacaWebSocketManager()

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
            type_ = data.get("type", "trades")  # 🆕 default to "trades"

            if action == "subscribe" and symbol:
                await alpaca_ws_manager.subscribe_symbol(websocket, symbol, type_)
                alpaca_ws_manager.print_status()
            elif action == "unsubscribe" and symbol:
                await alpaca_ws_manager.unsubscribe_symbol(websocket, symbol, type_)
                alpaca_ws_manager.print_status()
            elif action == "get_subscriptions":
                symbols = alpaca_ws_manager.get_my_subscribed_symbols(websocket)
                await websocket.send_text(json.dumps({
                    "type": "subscriptions",
                    "symbols": {k: list(v) for k, v in symbols.items()}
                }))

    except WebSocketDisconnect:
        await alpaca_ws_manager.unregister_client(websocket)
        alpaca_ws_manager.print_status()
