"""
Main FastAPI application entry point. Sets up middleware, routers, root route, and initializes the database.
"""

import asyncio
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from typing import AsyncGenerator

from app.database import sync_engine, Base
from app.api import auth
from app.api import user, position, user_setting, transaction, simulation_ws
from app.tasks.simulation import update_simulation_time   # Add more routers as needed

# Load environment variables from .env file
load_dotenv()

# Configuration values with fallbacks
# HOST = os.getenv("HOST", "127.0.0.1")
# PORT = int(os.getenv("PORT", 8000))
raw_origins = os.getenv("FRONTEND_ORIGIN", "")
origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

logging.basicConfig(
    level=logging.INFO,  # or INFO
    format="%(levelname)s | %(asctime)s | %(message)s",
)

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Async context manager for FastAPI lifespan events.
    Initializes DB and launches background sim clock task.
    """
    try:
        with sync_engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ DB connected:", result.scalar_one())
        Base.metadata.create_all(bind=sync_engine)
    except Exception as e:
        print("❌ Failed to connect to DB:", e)

    # Start simulation time updater in background
    task = asyncio.create_task(update_simulation_time())
    print("🕒 Simulation updater started")

    try:
        yield  # App is running
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            print("🛑 Simulation updater stopped")




# Initialize FastAPI app
app = FastAPI(
    title="WOAA Trading API",
    description="Backend service for a simulated trading application.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["root"])
def read_root():
    """
    Root endpoint that returns a welcome message.

    Returns:
        dict: Basic API metadata and health status.
    """
    return {
        "message": "Welcome to the WOAA Trading API 🚀",
        "status": "ok",
        "docs": "/docs"
    }


# Register routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(position.router)
app.include_router(user_setting.router)
app.include_router(transaction.router)
app.include_router(simulation_ws.router)



# app.include_router(admin.router, prefix="/admin", tags=["admin"])
