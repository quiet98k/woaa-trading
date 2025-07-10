"""
@fileoverview
Tests for the /user-settings API, covering:
- GET /user-settings/me
- PATCH /user-settings/me/speed
- PATCH /user-settings/me/pause
- PATCH /user-settings/me/start-time
- GET /user-settings/{user_id}
- PUT /user-settings/{user_id}

Includes success cases, auth enforcement, validation errors, and admin vs. regular-user behavior.
"""

import pytest
import uuid
from httpx import AsyncClient
from datetime import date

@pytest.mark.asyncio
async def test_get_my_settings_success(client: AsyncClient):
    # Register and login a regular user
    u = {
        "username": f"user_{uuid.uuid4().hex[:6]}",
        "email": f"user_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw123"
    }
    await client.post("/auth/register", json=u)
    login = await client.post("/auth/login", data={"username": u["email"], "password": u["password"]})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Should return default settings
    resp = await client.get("/user-settings/me", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "commission_rate" in data
    assert "start_time" in data
    assert "speed" in data
    assert data["paused"] is not None

@pytest.mark.asyncio
async def test_get_my_settings_unauthorized(client: AsyncClient):
    resp = await client.get("/user-settings/me")
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_set_my_speed_success_and_validation(client: AsyncClient):
    # Setup user
    u = {
        "username": f"user2_{uuid.uuid4().hex[:6]}",
        "email": f"user2_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw123"
    }
    await client.post("/auth/register", json=u)
    login = await client.post("/auth/login", data={"username": u["email"], "password": u["password"]})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Valid update
    resp = await client.patch("/user-settings/me/speed", json={"speed": 5}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["speed"] == 5

    # Negative speed → 422
    resp = await client.patch("/user-settings/me/speed", json={"speed": -1}, headers=headers)
    assert resp.status_code == 422

    # Missing field → 422
    resp = await client.patch("/user-settings/me/speed", json={}, headers=headers)
    assert resp.status_code == 422

@pytest.mark.asyncio
async def test_set_my_speed_unauthorized(client: AsyncClient):
    resp = await client.patch("/user-settings/me/speed", json={"speed": 1})
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_set_my_pause_success_and_validation(client: AsyncClient):
    # Setup user
    u = {
        "username": f"user3_{uuid.uuid4().hex[:6]}",
        "email": f"user3_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw123"
    }
    await client.post("/auth/register", json=u)
    login = await client.post("/auth/login", data={"username": u["email"], "password": u["password"]})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Pause
    resp = await client.patch("/user-settings/me/pause", json={"paused": True}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["paused"] is True

    # Resume
    resp = await client.patch("/user-settings/me/pause", json={"paused": False}, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["paused"] is False

    # Missing → 422
    resp = await client.patch("/user-settings/me/pause", json={}, headers=headers)
    assert resp.status_code == 422

@pytest.mark.asyncio
async def test_set_my_pause_unauthorized(client: AsyncClient):
    resp = await client.patch("/user-settings/me/pause", json={"paused": True})
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_set_my_start_time_success_and_errors(client: AsyncClient):
    # Setup user
    u = {
        "username": f"user4_{uuid.uuid4().hex[:6]}",
        "email": f"user4_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw123"
    }
    await client.post("/auth/register", json=u)
    login = await client.post("/auth/login", data={"username": u["email"], "password": u["password"]})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Valid date
    new_date = "2000-01-01"
    resp = await client.patch("/user-settings/me/start-time", json={"start_time": new_date}, headers=headers)
    assert resp.status_code == 200
    out = resp.json()
    # backend sets both start_time and sim_time
    assert out["start_time"].startswith(new_date)
    assert out["sim_time"].startswith(new_date)

    # Invalid format → 400
    resp = await client.patch("/user-settings/me/start-time", json={"start_time": "01-01-2000"}, headers=headers)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Invalid date format. Use YYYY-MM-DD."

    # Missing → 422
    resp = await client.patch("/user-settings/me/start-time", json={}, headers=headers)
    assert resp.status_code == 422

@pytest.mark.asyncio
async def test_set_my_start_time_unauthorized(client: AsyncClient):
    resp = await client.patch("/user-settings/me/start-time", json={"start_time": "2025-07-01"})
    assert resp.status_code == 401

@pytest.mark.asyncio
async def test_get_settings_by_user_id_success_and_errors(client: AsyncClient):
    """
    Authenticated users can fetch settings for any user;
    nonexistent user → 404; no auth → 401.
    """
    # 1️⃣ Register user and capture their ID
    u1 = {
        "username": f"u1_{uuid.uuid4().hex[:6]}",
        "email":   f"u1_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    }
    reg = await client.post("/auth/register", json=u1)
    assert reg.status_code == 200
    user_id = reg.json()["id"]

    # 2️⃣ Login as that same user
    login = await client.post(
        "/auth/login",
        data={"username": u1["email"], "password": u1["password"]},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3️⃣ Fetch their settings by ID
    resp = await client.get(f"/user-settings/{user_id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == user_id

    # 4️⃣ Nonexistent user → 404
    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/user-settings/{fake_id}", headers=headers)
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Settings not found"

    # 5️⃣ No auth → 401
    resp = await client.get(f"/user-settings/{user_id}")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_update_settings_admin_success_and_errors(client: AsyncClient):
    # Register regular user
    u = {
        "username": f"usr_{uuid.uuid4().hex[:6]}",
        "email": f"usr_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw"
    }
    reg = await client.post("/auth/register", json=u)
    user_id = reg.json()["id"]

    # Fetch current settings as template
    # First login as any user to GET template
    login = await client.post("/auth/login", data={"username": u["email"], "password": u["password"]})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    get_resp = await client.get(f"/user-settings/{user_id}", headers=headers)
    template = get_resp.json()
    # Remove read-only fields
    template.pop("user_id", None)
    template.pop("updated_at", None)

    # Register & login admin
    admin = {
        "username": f"adm_{uuid.uuid4().hex[:6]}",
        "email": f"adm_{uuid.uuid4().hex[:6]}@example.com",
        "password": "pw",
        "is_admin": True
    }
    await client.post("/auth/register-admin", json=admin)
    login2 = await client.post("/auth/login", data={"username": admin["email"], "password": admin["password"]})
    admin_token = login2.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Modify one numeric field
    template["commission_rate"] = template["commission_rate"] * 2
    put_resp = await client.put(f"/user-settings/{user_id}", json=template, headers=admin_headers)
    assert put_resp.status_code == 200
    assert put_resp.json()["commission_rate"] == template["commission_rate"]

    # Unauthorized as regular user → 403
    bad = await client.put(f"/user-settings/{user_id}", json=template, headers=headers)
    assert bad.status_code == 403

    # No token → 401
    no_tok = await client.put(f"/user-settings/{user_id}", json=template)
    assert no_tok.status_code == 401

    # Missing fields → 422
    miss = await client.put(f"/user-settings/{user_id}", json={}, headers=admin_headers)
    assert miss.status_code == 422

    # Invalid literal → 422 (bad commission_type)
    invalid = template.copy()
    invalid["commission_type"] = "wrong"
    inv = await client.put(f"/user-settings/{user_id}", json=invalid, headers=admin_headers)
    assert inv.status_code == 422
