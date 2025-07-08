from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

if not all([DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD]):
    raise RuntimeError("❌ Missing one or more database environment variables!")

# Async DATABASE_URL (for FastAPI and Alembic)
ASYNC_DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
SYNC_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Engines
async_engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)
sync_engine = create_engine(SYNC_DATABASE_URL, echo=False)

# Session maker
async_session_maker = async_sessionmaker(
    bind=async_engine,
    expire_on_commit=False,
)

# Declarative base
Base = declarative_base()

# Dependency for FastAPI routes
async def get_db() -> AsyncSession:  # type: ignore
    async with async_session_maker() as session:
        yield session
