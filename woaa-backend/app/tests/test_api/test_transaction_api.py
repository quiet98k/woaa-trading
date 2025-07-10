"""
@fileoverview
Tests for the /transactions API, including:
- POST /transactions/
- GET /transactions/
- GET /transactions/user/{user_id}
- GET /transactions/item/{tx_id}
- PUT /transactions/item/{tx_id}
- DELETE /transactions/item/{tx_id}

Covers valid flows, auth, ownership, and edge cases.
"""

import pytest
import uuid
from httpx import AsyncClient
from datetime import datetime

def sample_transaction():
    return {
        "symbol": "AAPL",
        "shares": 10,
        "price": 150.25,
        "action": "buy",
        "commission_charged": 1.50,
        "commission_type": "sim",
        "notes": "Test buy"
    }

@pytest.mark.asyncio
async def test_create_and_get_transactions(client: AsyncClient):
    """
    Test creating a transaction and retrieving it.
    """
    user_data = {
        "username": f"txuser_{uuid.uuid4().hex[:6]}",
        "email": f"txuser_{uuid.uuid4().hex[:6]}@example.com",
        "password": "securepass"
    }
    await client.post("/auth/register", json=user_data)
    login = await client.post("/auth/login", data={
        "username": user_data["email"],
        "password": user_data["password"]
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create transaction
    resp = await client.post("/transactions/", json=sample_transaction(), headers=headers)
    assert resp.status_code == 201
    tx = resp.json()
    tx_id = tx["id"]
    assert tx["symbol"] == "AAPL"

    # Get all user transactions
    resp = await client.get("/transactions/", headers=headers)
    assert resp.status_code == 200
    assert any(t["id"] == tx_id for t in resp.json())

    # Get transaction by ID (user's own)
    resp = await client.get(f"/transactions/item/{tx_id}", headers=headers)
    assert resp.status_code == 403  # Only admins allowed

@pytest.mark.asyncio
async def test_admin_get_by_user_id(client: AsyncClient):
    """
    Admin fetches transactions for another user.
    """
    # Create normal user + tx
    reg = await client.post("/auth/register", json={
        "username": "normie",
        "email": f"normie_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    })
    user = reg.json()

    login = await client.post("/auth/login", data={"username": user["email"], "password": "pw"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    tx_resp = await client.post("/transactions/", json=sample_transaction(), headers=headers)
    assert tx_resp.status_code == 201

    # Create and login admin
    admin = {
        "username": f"admin_{uuid.uuid4().hex[:6]}",
        "email": f"admin_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw",
        "is_admin": True
    }
    await client.post("/auth/register-admin", json=admin)
    login = await client.post("/auth/login", data={"username": admin["email"], "password": admin["password"]})
    admin_token = login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin gets user transactions
    resp = await client.get(f"/transactions/user/{user['id']}", headers=admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()) > 0


@pytest.mark.asyncio
async def test_update_and_delete_transaction(client: AsyncClient):
    """
    User updates and deletes their own transaction.
    """
    user_data = {
        "username": f"user_tx_{uuid.uuid4().hex[:6]}",
        "email": f"user_tx_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    }
    await client.post("/auth/register", json=user_data)
    login = await client.post("/auth/login", data={"username": user_data["email"], "password": user_data["password"]})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create transaction
    resp = await client.post("/transactions/", json=sample_transaction(), headers=headers)
    assert resp.status_code == 201
    tx = resp.json()
    tx_id = tx["id"]

    # Update transaction notes
    update = {"notes": "Updated notes"}
    resp = await client.put(f"/transactions/item/{tx_id}", json=update, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["notes"] == "Updated notes"

    # Delete transaction
    resp = await client.delete(f"/transactions/item/{tx_id}", headers=headers)
    assert resp.status_code == 204

    # Confirm deletion
    resp = await client.put(f"/transactions/item/{tx_id}", json=update, headers=headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_unauthorized_transaction_access(client: AsyncClient):
    """
    Test accessing another user's transaction returns 404.
    """
    # User A
    user1 = {
        "username": "u1",
        "email": f"u1_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    }
    await client.post("/auth/register", json=user1)
    login = await client.post("/auth/login", data={"username": user1["email"], "password": "pw"})
    token1 = login.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    resp = await client.post("/transactions/", json=sample_transaction(), headers=headers1)
    tx_id = resp.json()["id"]

    # User B tries to update/delete
    user2 = {
        "username": "u2",
        "email": f"u2_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    }
    await client.post("/auth/register", json=user2)
    login = await client.post("/auth/login", data={"username": user2["email"], "password": "pw"})
    token2 = login.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Should all return 404 (not owned by user2)
    resp = await client.put(f"/transactions/item/{tx_id}", json={"notes": "x"}, headers=headers2)
    assert resp.status_code == 404

    resp = await client.delete(f"/transactions/item/{tx_id}", headers=headers2)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_invalid_transaction_input(client: AsyncClient):
    """
    Invalid values (like negative price) should fail.
    """
    user = {
        "username": f"badtx_{uuid.uuid4().hex[:6]}",
        "email": f"badtx_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    }
    await client.post("/auth/register", json=user)
    login = await client.post("/auth/login", data={"username": user["email"], "password": "pw"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Missing required fields
    bad_data = {"symbol": "AAPL"}
    resp = await client.post("/transactions/", json=bad_data, headers=headers)
    assert resp.status_code == 422

    # Negative price
    bad_data = sample_transaction()
    bad_data["price"] = -100
    resp = await client.post("/transactions/", json=bad_data, headers=headers)
    assert resp.status_code == 422

    # Invalid action
    bad_data = sample_transaction()
    bad_data["action"] = "steal"
    resp = await client.post("/transactions/", json=bad_data, headers=headers)
    assert resp.status_code == 422
