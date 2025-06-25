"""
WebSocket endpoint for streaming merged historical bar data from Alpaca.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.data import fetch_all_historical_bars
from app.schemas.data import HistoricalBarsQuery
import json

router = APIRouter()


@router.websocket("/ws/data/historical")
async def websocket_historical_data(websocket: WebSocket):
    """
    WebSocket endpoint to stream merged historical bars on demand.

    Expects JSON from frontend:
    {
        "symbols": "AAPL,TSLA",
        "timeframe": "1Min",
        "start": "2024-06-01",
        "end": "2024-06-03",
        ...
    }

    Sends:
    - A single merged JSON result (or multiple chunks in future)
    """
    await websocket.accept()
    try:
        query_str = await websocket.receive_text()
        query_data = json.loads(query_str)
        query = HistoricalBarsQuery(**query_data)

        result = fetch_all_historical_bars(query)
        await websocket.send_text(json.dumps(result))

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        await websocket.send_text(json.dumps({"error": str(e)}))
        await websocket.close()
