import os
import asyncio
import json
from fastapi import WebSocket
import websockets
from websockets.exceptions import ConnectionClosed
from dotenv import load_dotenv

load_dotenv()

ALPACA_URL = "wss://stream.data.alpaca.markets/v2/iex"
API_KEY = os.getenv("ALPACA_API_KEY")
API_SECRET = os.getenv("ALPACA_SECRET_KEY")

class AlpacaWebSocketManager:
    def __init__(self):
        self.subscribers: dict[WebSocket, set[str]] = {}
        self.symbols = set()
        self.ws = None
        self.lock = asyncio.Lock()

    async def connect(self):
        async with self.lock:
            if self.ws and self.ws.close_code is None:
                return  # already connected
            
            try:
                print("[Alpaca WS] Connecting...")
                self.ws = await websockets.connect(ALPACA_URL)
                await self.ws.send(json.dumps({
                    "action": "auth",
                    "key": API_KEY,
                    "secret": API_SECRET
                }))
                resp = await self.ws.recv()
                print("[Alpaca WS] Auth response:", resp)

                # Resubscribe to all current symbols
                if self.symbols:
                    await self.ws.send(json.dumps({
                        "action": "subscribe",
                        "trades": list(self.symbols)
                    }))
                    print("[Alpaca WS] Resubscribed to:", self.symbols)

                asyncio.create_task(self.receive_data())

            except Exception as e:
                print(f"[Alpaca WS] Failed to connect: {e}")

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
            except ConnectionClosed:
                print(f"[Alpaca WS] Connection closed during subscribe to {symbol}, reconnecting...")
                await self.reconnect_and_resubscribe()

    async def unsubscribe_symbol(self, websocket: WebSocket, symbol: str):
        if websocket in self.subscribers and symbol in self.subscribers[websocket]:
            self.subscribers[websocket].remove(symbol)

            still_used = any(
                symbol in other_symbols
                for other_ws, other_symbols in self.subscribers.items()
            )
            if not still_used:
                await self.ensure_ws()
                try:
                    await self.ws.send(json.dumps({
                        "action": "unsubscribe",
                        "trades": [symbol]
                    }))
                    self.symbols.discard(symbol)
                except ConnectionClosed:
                    print(f"[Alpaca WS] Connection closed during unsubscribe from {symbol}, reconnecting...")
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
            print(f"[Alpaca WS] Error in receive loop: {e}")
            await self.reconnect_and_resubscribe()

    async def ensure_ws(self):
        if not self.ws or self.ws.close_code is not None:
            await self.connect()

    async def reconnect_and_resubscribe(self):
        print("[Alpaca WS] Reconnecting and resubscribing...")
        await self.connect()

    def register_client(self, websocket: WebSocket):
        self.subscribers[websocket] = set()

    async def unregister_client(self, websocket: WebSocket):
        symbols_to_check = self.subscribers.pop(websocket, set())

        for symbol in symbols_to_check:
            still_used = any(
                symbol in other_symbols
                for other_ws, other_symbols in self.subscribers.items()
            )
            if not still_used:
                await self.ensure_ws()
                try:
                    await self.ws.send(json.dumps({
                        "action": "unsubscribe",
                        "trades": [symbol]
                    }))
                    self.symbols.discard(symbol)
                except ConnectionClosed:
                    print(f"[Alpaca WS] Connection closed during unsubscribe cleanup for {symbol}")

    def get_my_subscribed_symbols(self, websocket: WebSocket) -> set[str]:
        return self.subscribers.get(websocket, set())

    def print_status(self):
        print(f"🔌 Connections: {len(self.subscribers)}")
        print(f"📈 Subscribed symbols: {self.symbols}")
        for ws, symbols in self.subscribers.items():
            print(f"  ↪️ Client {id(ws)} -> {symbols}")

alpaca_ws_manager = AlpacaWebSocketManager()
