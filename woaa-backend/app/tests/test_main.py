"""
Tests for the FastAPI root and health check endpoints.
"""

import pytest
from httpx import AsyncClient
from fastapi import status



async def test_health_check(client: AsyncClient):
    """
    Ensure the /health endpoint returns 200 OK and expected payload.
    """
    response = await client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"status": "ok"}



async def test_root_endpoint(client: AsyncClient):
    """
    Ensure the root endpoint (/) returns 200 OK and some welcome message.
    Modify this to match your actual root handler if defined.
    """
    response = await client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert "Welcome" in response.text or response.json()
