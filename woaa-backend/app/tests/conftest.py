"""
Shared pytest fixtures for setting up test database and FastAPI TestClient.
Loads .env.test, prepares a clean DB, and overrides FastAPI dependencies.
"""

import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from app.database import Base, get_db
from app.main import app

# Load .env.test
dotenv_path = os.path.join(os.path.dirname(__file__), ".env.test")
load_dotenv(dotenv_path=dotenv_path)

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Reset all tables once per test session."""
    print("🔧 [DB] Reinitializing test database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    print("🧹 [DB] Test database cleaned up.")

@pytest.fixture()
def db():
    """Yields a new SQLAlchemy DB session."""
    session = TestingSessionLocal()
    yield session
    session.close()

@pytest.fixture()
def client(db):
    """Yields a FastAPI TestClient with DB override."""
    app.dependency_overrides[get_db] = lambda: iter([db])
    with TestClient(app) as test_client:
        yield test_client
