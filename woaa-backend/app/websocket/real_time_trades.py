import os
import re
import json
import asyncio
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import websockets
from websockets.exceptions import ConnectionClosed
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Change to DEBUG for more verbose output
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

ALPACA_URL = "wss://stream.data.alpaca.markets/v2/iex"
API_KEY = os.getenv("ALPACA_API_KEY")
API_SECRET = os.getenv("ALPACA_SECRET_KEY")

VALID_SYMBOL_REGEX = re.compile(r"^[A-Z]{1,5}$")

router = APIRouter()

class AlpacaWebSocketManager:
    def __init__(self):
        self.subscribers: dict[WebSocket, set[str]] = {}
        self.symbols = set()
        self.ws = None
        self.lock = asyncio.Lock()

    async def connect(self):
        async with self.lock:
            if self.ws and self.ws.close_code is None:
                return
            try:
                logger.debug("Connecting to Alpaca WebSocket...")
                self.ws = await websockets.connect(ALPACA_URL)
                await self.ws.send(json.dumps({
                    "action": "auth",
                    "key": API_KEY,
                    "secret": API_SECRET
                }))
                resp = await self.ws.recv()
                logger.debug("Auth response: %s", resp)

                if self.symbols:
                    await self.ws.send(json.dumps({
                        "action": "subscribe",
                        "trades": list(self.symbols)
                    }))
                    logger.debug("Resubscribed to: %s", self.symbols)

                asyncio.create_task(self.receive_data())

            except Exception as e:
                logger.error("Failed to connect to Alpaca WebSocket: %s", e)

    async def subscribe_symbol(self, websocket: WebSocket, symbol: str):
        if websocket not in self.subscribers:
            self.subscribers[websocket] = set()
        self.subscribers[websocket].add(symbol)

        if symbol not in self.symbols:
            await self.ensure_ws()
            try:
                await self.ws.send(json.dumps({
                    "action": "subscribe",
                    "trades": [symbol]
                }))
                self.symbols.add(symbol)
                logger.debug("Subscribed to symbol: %s", symbol)
            except ConnectionClosed:
                logger.warning("Connection closed during subscribe to %s, reconnecting...", symbol)
                await self.reconnect_and_resubscribe()

    async def unsubscribe_symbol(self, websocket: WebSocket, symbol: str):
        if websocket in self.subscribers and symbol in self.subscribers[websocket]:
            self.subscribers[websocket].remove(symbol)

            still_used = any(symbol in other_symbols for other_symbols in self.subscribers.values())
            if not still_used:
                await self.ensure_ws()
                try:
                    await self.ws.send(json.dumps({
                        "action": "unsubscribe",
                        "trades": [symbol]
                    }))
                    self.symbols.discard(symbol)
                    logger.debug("Unsubscribed from symbol: %s", symbol)
                except ConnectionClosed:
                    logger.warning("Connection closed during unsubscribe from %s, reconnecting...", symbol)
                    await self.reconnect_and_resubscribe()

    async def receive_data(self):
        try:
            async for message in self.ws:
                disconnected = []
                for sub in self.subscribers:
                    try:
                        await sub.send_text(message)
                    except Exception:
                        disconnected.append(sub)
                for sub in disconnected:
                    await self.unregister_client(sub)
        except Exception as e:
            logger.info("Error in receive loop: %s", e)
            await self.reconnect_and_resubscribe()

    async def ensure_ws(self):
        if not self.ws or self.ws.close_code is not None:
            await self.connect()

    async def reconnect_and_resubscribe(self):
        logger.debug("Reconnecting and resubscribing to Alpaca WebSocket...")
        await self.connect()

    def register_client(self, websocket: WebSocket):
        self.subscribers[websocket] = set()

    async def unregister_client(self, websocket: WebSocket):
        symbols_to_check = self.subscribers.pop(websocket, set())

        for symbol in symbols_to_check:
            still_used = any(symbol in other_symbols for other_symbols in self.subscribers.values())
            if not still_used:
                await self.ensure_ws()
                try:
                    await self.ws.send(json.dumps({
                        "action": "unsubscribe",
                        "trades": [symbol]
                    }))
                    self.symbols.discard(symbol)
                    logger.debug("Unsubscribed from %s during cleanup", symbol)
                except ConnectionClosed:
                    logger.warning("Connection closed during unsubscribe cleanup for %s", symbol)

    def get_my_subscribed_symbols(self, websocket: WebSocket) -> set[str]:
        return self.subscribers.get(websocket, set())

    def print_status(self):
        logger.debug("🔌 Connections: %d", len(self.subscribers))
        logger.debug("📈 Subscribed symbols: %s", self.symbols)
        for ws, symbols in self.subscribers.items():
            logger.debug("  ↪️ Client %s -> %s", id(ws), symbols)

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

            if action == "subscribe" and symbol:
                await alpaca_ws_manager.subscribe_symbol(websocket, symbol)
                alpaca_ws_manager.print_status()
            elif action == "unsubscribe" and symbol:
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
