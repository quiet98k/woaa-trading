import os
import pytest_asyncio
import pytest
from httpx import AsyncClient
from fastapi import FastAPI
from asgi_lifespan import LifespanManager
from httpx import ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from dotenv import load_dotenv
from app.database import Base, get_db
from app.main import app

# Load test environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env.test"))

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
ASYNC_DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

@pytest.fixture(scope="session", autouse=True)
def set_test_env():
    os.environ["TESTING"] = "1"

@pytest_asyncio.fixture(scope="function")
async def async_engine_and_sessionmaker():
    # Create engine and sessionmaker inside the event loop
    async_engine = create_async_engine(ASYNC_DATABASE_URL, echo=False)
    AsyncTestingSessionLocal = async_sessionmaker(bind=async_engine, expire_on_commit=False)
    # Setup DB schema
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield async_engine, AsyncTestingSessionLocal
    # Teardown DB schema
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await async_engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def db(async_engine_and_sessionmaker) -> AsyncSession:
    _, AsyncTestingSessionLocal = async_engine_and_sessionmaker
    async with AsyncTestingSessionLocal() as session:
        yield session

@pytest_asyncio.fixture(scope="function")
async def client(db):
    # Override get_db to use the function-scoped session
    async def override_get_db():
        yield db
    app.dependency_overrides[get_db] = override_get_db
    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac
