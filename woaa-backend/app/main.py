"""
Main FastAPI application entry point. Sets up middleware, routers, root route, and initializes the database.
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from app.database import engine, Base
from app.api import auth
from app.api import user, trade, admin  # Add more routers as needed

# Load environment variables from .env file
load_dotenv()

# Configuration values with fallbacks
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", 8000))
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Async context manager for FastAPI lifespan events.
    Verifies DB connection and creates tables at startup.
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ DB connected:", result.scalar_one())
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print("❌ Failed to connect to DB:", e)
    yield


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
    allow_origins=[FRONTEND_ORIGIN],
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
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/user", tags=["user"])
# app.include_router(trade.router, prefix="/trade", tags=["trade"])
# app.include_router(admin.router, prefix="/admin", tags=["admin"])
