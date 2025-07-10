"""
@fileoverview
Tests for the /logs API routes, covering:
- POST /logs
- GET  /logs/me
- GET  /logs/{user_id}

Includes creation, per-user retrieval, admin vs. non-admin access, 
and validation errors.
"""

import pytest
import uuid
from httpx import AsyncClient


def sample_log_entry(user_id: str) -> dict:
    """
    Returns a valid log creation payload for the given user_id.
    """
    return {
        "user_id": user_id,
        "action": "test_action",
        "details": "This is a test log entry"
    }


@pytest.mark.asyncio
async def test_create_log_success(client: AsyncClient):
    """
    POST /logs with valid payload should create a log entry.
    """
    # Register a user to get a valid user_id
    reg = await client.post("/auth/register", json={
        "username": f"loguser_{uuid.uuid4().hex[:6]}",
        "email":   f"log_{uuid.uuid4().hex[:6]}@example.com",
        "password": "password123"
    })
    assert reg.status_code == 200
    user_id = reg.json()["id"]

    # Create the log
    resp = await client.post("/logs/", json=sample_log_entry(user_id))
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == user_id
    assert data["action"] == "test_action"
    assert "id" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_create_log_missing_fields(client: AsyncClient):
    """
    Missing required fields in POST /logs should return 422.
    """
    payloads = [
        {},  # nothing
        {"action": "a", "details": "d"},               # missing user_id
        {"user_id": str(uuid.uuid4()), "details": "d"},# missing action
        {"user_id": str(uuid.uuid4()), "action": "a"}  # missing details
    ]
    for p in payloads:
        resp = await client.post("/logs/", json=p)
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_get_own_logs_success(client: AsyncClient):
    """
    GET /logs/me should return only logs belonging to the authenticated user.
    """
    # Register two users
    reg1 = await client.post("/auth/register", json={
        "username": f"user1_{uuid.uuid4().hex[:6]}",
        "email":   f"user1_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    })
    user1_id = reg1.json()["id"]

    reg2 = await client.post("/auth/register", json={
        "username": f"user2_{uuid.uuid4().hex[:6]}",
        "email":   f"user2_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    })
    user2_id = reg2.json()["id"]

    # Create one log for each user
    await client.post("/logs/", json=sample_log_entry(user1_id))
    await client.post("/logs/", json=sample_log_entry(user2_id))

    # Login as user1
    login = await client.post("/auth/login", data={
        "username": reg1.json()["email"],
        "password": "pw"
    })
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch own logs
    resp = await client.get("/logs/me", headers=headers)
    assert resp.status_code == 200
    logs = resp.json()
    assert all(log["user_id"] == user1_id for log in logs)
    # Should include at least the one we created
    assert any(log["action"] == "test_action" for log in logs)


@pytest.mark.asyncio
async def test_get_own_logs_unauthorized(client: AsyncClient):
    """
    GET /logs/me without auth should return 401.
    """
    resp = await client.get("/logs/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_logs_by_user_id_admin_success(client: AsyncClient):
    """
    Admin GET /logs/{user_id} should return that user's logs.
    """
    # Register and create a log for user
    reg = await client.post("/auth/register", json={
        "username": f"userx_{uuid.uuid4().hex[:6]}",
        "email":   f"userx_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    })
    user_id = reg.json()["id"]
    await client.post("/logs/", json=sample_log_entry(user_id))

    # Register admin
    admin = {
        "username": f"adm_{uuid.uuid4().hex[:6]}",
        "email":   f"adm_{uuid.uuid4().hex[:6]}@example.com",
        "password": "adminpw",
        "is_admin": True
    }
    await client.post("/auth/register-admin", json=admin)
    login_admin = await client.post("/auth/login", data={
        "username": admin["email"], "password": admin["password"]
    })
    token_admin = login_admin.json()["access_token"]
    headers_admin = {"Authorization": f"Bearer {token_admin}"}

    # Admin fetches logs
    resp = await client.get(f"/logs/{user_id}", headers=headers_admin)
    assert resp.status_code == 200
    logs = resp.json()
    assert all(log["user_id"] == user_id for log in logs)


@pytest.mark.asyncio
async def test_get_logs_by_user_id_forbidden(client: AsyncClient):
    """
    Non-admin GET /logs/{other_user} should return 403.
    """
    # Register two users
    reg1 = await client.post("/auth/register", json={
        "username": f"a_{uuid.uuid4().hex[:6]}",
        "email":   f"a_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    })
    other_id = reg1.json()["id"]

    reg2 = await client.post("/auth/register", json={
        "username": f"b_{uuid.uuid4().hex[:6]}",
        "email":   f"b_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    })
    login2 = await client.post("/auth/login", data={
        "username": reg2.json()["email"], "password": "pw"
    })
    headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

    resp = await client.get(f"/logs/{other_id}", headers=headers2)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_logs_by_user_id_unauthorized(client: AsyncClient):
    """
    GET /logs/{user_id} without auth should return 401.
    """
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/logs/{fake_id}")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_invalid_uuid_format(client: AsyncClient):
    """
    Invalid UUID in path returns 422.
    """
    # Register admin
    admin = {
        "username": f"adm2_{uuid.uuid4().hex[:6]}",
        "email":   f"adm2_{uuid.uuid4().hex[:6]}@example.com",
        "password": "adminpw",
        "is_admin": True
    }
    await client.post("/auth/register-admin", json=admin)
    login_admin = await client.post("/auth/login", data={
        "username": admin["email"], "password": admin["password"]
    })
    headers_admin = {"Authorization": f"Bearer {login_admin.json()['access_token']}"}

    resp = await client.get("/logs/not-a-uuid", headers=headers_admin)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_log_invalid_user_id_format(client: AsyncClient):
    """
    POST /logs with malformed user_id should return 422.
    """
    payload = {"user_id": "bad-uuid", "action": "a", "details": "d"}
    resp = await client.post("/logs/", json=payload)
    assert resp.status_code == 422
