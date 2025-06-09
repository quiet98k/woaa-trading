"""
Provides shared fixtures for testing FastAPI with a test client and environment variables.
"""

import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from dotenv import load_dotenv

@pytest.fixture(scope="session", autouse=True)
def load_test_env():
    """Load environment variables from .env.test before all tests."""
    load_dotenv(dotenv_path=".env.test")

@pytest.fixture(scope="module")
def client():
    """Fixture to create a test client for FastAPI."""
    with TestClient(app) as test_client:
        yield test_client
