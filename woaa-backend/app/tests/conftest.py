"""
Shared pytest fixtures for setting up test database and client.
Loads configuration from .env.test and creates all tables in a clean test DB.
Includes debug output for verification.
"""

import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.database import Base
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db


# Load .env.test from the current folder
DOTENV_PATH = os.path.join(os.path.dirname(__file__), ".env.test")
print(f"🔍 Loading environment from: {DOTENV_PATH}")
load_dotenv(dotenv_path=DOTENV_PATH)

# Get env vars
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

# Construct and log the DB URL (partially obfuscated)
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
print(f"Using DATABASE_URL: postgresql://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# Setup SQLAlchemy engine and session
engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    Drops and recreates all tables before the test session starts.
    """
    print("Dropping and recreating all tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    print("Dropping all tables after tests...")
    Base.metadata.drop_all(bind=engine)

@pytest.fixture()
def db():
    """
    Provides a new DB session for each test function.
    """
    print("Creating new DB session")
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        print("Closing DB session")
        session.close()

@pytest.fixture()
def client(db):
    """
    Provides a FastAPI TestClient with a test DB session.
    """
    print("Overriding get_db for TestClient")
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client
