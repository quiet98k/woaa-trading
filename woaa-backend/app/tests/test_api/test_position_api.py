"""
@fileoverview
Tests for the /positions API including:
- POST /positions/
- GET /positions/
- GET /positions/{position_id}
- PUT /positions/{position_id}
- DELETE /positions/{position_id}

Covers valid flows, ownership checks, and edge cases.
"""

import pytest
import uuid
from httpx import AsyncClient

# Sample position data (adjust if needed)
def sample_position():
    return {
        "symbol": "AAPL",
        "position_type": "Long", 
        "open_price": 100.0,
        "open_shares": 10
    }


@pytest.mark.asyncio
async def test_create_get_update_delete_position(client: AsyncClient):
    """
    Full flow: create → get → update → delete a position.
    """
    # Register and login user
    user_data = {
        "username": f"posuser_{uuid.uuid4().hex[:6]}",
        "email": f"pos_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pospass"
    }
    await client.post("/auth/register", json=user_data)
    login = await client.post("/auth/login", data={
        "username": user_data["email"],
        "password": user_data["password"]
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create position
    resp = await client.post("/positions/", json=sample_position(), headers=headers)
    assert resp.status_code == 201
    position = resp.json()
    position_id = position["id"]
    assert position["symbol"] == "AAPL"

    # Get all positions
    resp = await client.get("/positions/", headers=headers)
    assert resp.status_code == 200
    assert any(p["id"] == position_id for p in resp.json())

    # Get position by ID
    resp = await client.get(f"/positions/{position_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == position_id

    # Update position
    update_data = {"status": "closed"}
    resp = await client.put(f"/positions/{position_id}", json=update_data, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"

    # Delete position
    resp = await client.delete(f"/positions/{position_id}", headers=headers)
    assert resp.status_code == 204

    # Confirm deletion
    resp = await client.get(f"/positions/{position_id}", headers=headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    """
    Ensure endpoints reject requests without a token.
    """
    resp = await client.get("/positions/")
    assert resp.status_code == 401

    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/positions/{fake_id}")
    assert resp.status_code == 401

    resp = await client.post("/positions/", json=sample_position())
    assert resp.status_code == 401

    resp = await client.put(f"/positions/{fake_id}", json={"open_shares": 5})
    assert resp.status_code == 401

    resp = await client.delete(f"/positions/{fake_id}")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_forbidden_position_access(client: AsyncClient):
    """
    Ensure users cannot access or modify others' positions.
    """
    # User 1 creates a position
    user1 = {
        "username": f"user1_{uuid.uuid4().hex[:6]}",
        "email": f"user1_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pass1"
    }
    await client.post("/auth/register", json=user1)
    login1 = await client.post("/auth/login", data={"username": user1["email"], "password": user1["password"]})
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    create_resp = await client.post("/positions/", json=sample_position(), headers=headers1)
    pos_id = create_resp.json()["id"]

    # User 2 tries to access it
    user2 = {
        "username": f"user2_{uuid.uuid4().hex[:6]}",
        "email": f"user2_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pass2"
    }
    await client.post("/auth/register", json=user2)
    login2 = await client.post("/auth/login", data={"username": user2["email"], "password": user2["password"]})
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    resp = await client.get(f"/positions/{pos_id}", headers=headers2)
    assert resp.status_code == 404

    resp = await client.put(f"/positions/{pos_id}", json={"open_shares": 1}, headers=headers2)
    assert resp.status_code == 404

    resp = await client.delete(f"/positions/{pos_id}", headers=headers2)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_invalid_position_create(client: AsyncClient):
    """
    Test position creation with missing/invalid fields.
    """
    # Login
    user_data = {
        "username": f"badpos_{uuid.uuid4().hex[:6]}",
        "email": f"badpos_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    }
    await client.post("/auth/register", json=user_data)
    login = await client.post("/auth/login", data={
        "username": user_data["email"],
        "password": user_data["password"]
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Missing required fields
    bad_data = {"symbol": "TSLA"}
    resp = await client.post("/positions/", json=bad_data, headers=headers)
    assert resp.status_code == 422

    # Negative shares
    invalid = sample_position()
    invalid["open_shares"] = -5
    resp = await client.post("/positions/", json=invalid, headers=headers)
    assert resp.status_code == 422

    # Zero price
    invalid = sample_position()
    invalid["open_price"] = 0
    resp = await client.post("/positions/", json=invalid, headers=headers)
    assert resp.status_code == 422
