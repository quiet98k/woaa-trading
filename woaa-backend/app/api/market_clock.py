# app/api/market_clock.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
import os
import httpx
from dotenv import load_dotenv
from app.auth import get_current_user

load_dotenv()

router = APIRouter()

ALPACA_CLOCK_URL = "https://api.alpaca.markets/v2/clock"
HEADERS = {
    "APCA-API-KEY-ID": os.getenv("ALPACA_API_KEY"),
    "APCA-API-SECRET-KEY": os.getenv("ALPACA_SECRET_KEY"),
    "Accept": "application/json",
}

@router.get("/market/clock")
async def get_market_clock(user=Depends(get_current_user)):
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(ALPACA_CLOCK_URL, headers=HEADERS)
            res.raise_for_status()
            return JSONResponse(content=res.json())
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch market clock")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
