"""
WebSocket manager for pushing sim_time updates to users.
"""

from fastapi import WebSocket
from uuid import UUID
from typing import Dict


class SimTimeManager:
    def __init__(self):
        self.connections: Dict[UUID, WebSocket] = {}

    async def connect(self, user_id: UUID, websocket: WebSocket):
        await websocket.accept()
        self.connections[user_id] = websocket

    def disconnect(self, user_id: UUID):
        self.connections.pop(user_id, None)

    async def send_sim_time(self, user_id: UUID, sim_time: str):
        ws = self.connections.get(user_id)
        if ws:
            await ws.send_json({"sim_time": sim_time})


sim_time_manager = SimTimeManager()
