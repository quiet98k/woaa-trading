import os
import asyncio
import json
from fastapi import WebSocket
import websockets
from dotenv import load_dotenv

load_dotenv()

# ALPACA_URL = "wss://stream.data.alpaca.markets/v2/test"
ALPACA_URL = "wss://stream.data.alpaca.markets/v2/iex"
API_KEY = os.getenv("ALPACA_API_KEY")
API_SECRET = os.getenv("ALPACA_SECRET_KEY")




class AlpacaWebSocketManager:
    def __init__(self):
        self.subscribers: dict[WebSocket, set[str]] = {}
        self.symbols = set()
        self.ws = None

    async def connect(self):
        self.ws = await websockets.connect(ALPACA_URL)
        await self.ws.send(json.dumps({
            "action": "auth",
            "key": API_KEY,
            "secret": API_SECRET
        }))
        resp = await self.ws.recv()
        print("Auth response:", resp)
        asyncio.create_task(self.receive_data())

    async def subscribe_symbol(self, websocket: WebSocket, symbol: str):
        if websocket not in self.subscribers:
            self.subscribers[websocket] = set()
        self.subscribers[websocket].add(symbol)

        if symbol not in self.symbols:
            await self.ws.send(json.dumps({
                "action": "subscribe",
                "trades": [symbol]
            }))
            self.symbols.add(symbol)

    async def receive_data(self):
        async for message in self.ws:
            disconnected = []
            for sub in self.subscribers:
                try:
                    await sub.send_text(message)
                except RuntimeError:
                    disconnected.append(sub)

            for sub in disconnected:
                await self.unregister_client(sub)

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
                await self.ws.send(json.dumps({
                    "action": "unsubscribe",
                    "trades": [symbol]
                }))
                self.symbols.discard(symbol)
    def print_status(self):
        print(f"🔌 Connections: {len(self.subscribers)}")
        print(f"📈 Subscribed symbols: {self.symbols}")
        for ws, symbols in self.subscribers.items():
            print(f"  ↪️ Client {id(ws)} -> {symbols}")

alpaca_ws_manager = AlpacaWebSocketManager()
