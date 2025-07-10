"""
@fileoverview
Tests for the /user API routes, including:
- GET /me
- GET /user/{user_id}
- PATCH /user/{user_id}/balances

Covers regular and admin access, input validation, and edge cases.
"""

import pytest
import uuid
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_me_success(client: AsyncClient):
    """
    Test /me returns the current user profile with a valid token.
    """
    # Register and login a user
    user_data = {
        "username": f"me_user_{uuid.uuid4().hex[:8]}",
        "email": f"me_user_{uuid.uuid4().hex[:8]}@example.com",
        "password": "testpassword"
    }
    await client.post("/auth/register", json=user_data)
    login = await client.post("/auth/login", data={
        "username": user_data["email"],
        "password": user_data["password"]
    })
    token = login.json()["access_token"]

    # Call /me with token
    resp = await client.get("/user/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == user_data["username"]
    assert data["email"] == user_data["email"]
    assert "id" in data


@pytest.mark.asyncio
async def test_get_me_unauthorized(client: AsyncClient):
    """
    Test /me without a token returns 401.
    """
    resp = await client.get("/user/me")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_admin_get_user_success(client: AsyncClient):
    """
    Admin can fetch another user by ID.
    """
    # Register regular user
    user_data = {
        "username": f"target_{uuid.uuid4().hex[:8]}",
        "email": f"target_{uuid.uuid4().hex[:8]}@example.com",
        "password": "testpassword"
    }
    reg = await client.post("/auth/register", json=user_data)
    target_user = reg.json()

    # Register admin
    admin_data = {
        "username": f"admin_{uuid.uuid4().hex[:8]}",
        "email": f"admin_{uuid.uuid4().hex[:8]}@example.com",
        "password": "adminpassword",
        "is_admin": True
    }
    await client.post("/auth/register-admin", json=admin_data)
    login = await client.post("/auth/login", data={
        "username": admin_data["email"],
        "password": admin_data["password"]
    })
    token = login.json()["access_token"]

    # Fetch user by ID as admin
    resp = await client.get(f"/user/{target_user['id']}", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == target_user["id"]


@pytest.mark.asyncio
async def test_admin_get_user_not_found(client: AsyncClient):
    """
    Admin fetching a nonexistent user should return 404.
    """
    # Login as admin
    admin_data = {
        "username": f"admin404_{uuid.uuid4().hex[:8]}",
        "email": f"admin404_{uuid.uuid4().hex[:8]}@example.com",
        "password": "adminpassword",
        "is_admin": True
    }
    await client.post("/auth/register-admin", json=admin_data)
    login = await client.post("/auth/login", data={
        "username": admin_data["email"],
        "password": admin_data["password"]
    })
    token = login.json()["access_token"]

    fake_id = str(uuid.uuid4())
    resp = await client.get(f"/user/{fake_id}", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 404
    assert resp.json()["detail"] == "User not found"


@pytest.mark.asyncio
async def test_admin_get_user_unauthorized(client: AsyncClient):
    """
    Non-admin should not access /user/{user_id}.
    """
    # Register + login normal user
    user_data = {
        "username": f"user_{uuid.uuid4().hex[:8]}",
        "email": f"user_{uuid.uuid4().hex[:8]}@example.com",
        "password": "password"
    }
    reg = await client.post("/auth/register", json=user_data)
    user = reg.json()

    login = await client.post("/auth/login", data={
        "username": user_data["email"],
        "password": user_data["password"]
    })
    token = login.json()["access_token"]

    # Try to access another user (admin endpoint)
    resp = await client.get(f"/user/{user['id']}", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_patch_balances_success(client: AsyncClient):
    """
    Admin can update user balances.
    """
    # Register target user
    reg = await client.post("/auth/register", json={
        "username": "balance_user",
        "email": f"balance_{uuid.uuid4().hex[:8]}@example.com",
        "password": "pw"
    })
    user = reg.json()

    # Register and login admin
    admin_data = {
        "username": f"admin_bal_{uuid.uuid4().hex[:8]}",
        "email": f"admin_bal_{uuid.uuid4().hex[:8]}@example.com",
        "password": "pw",
        "is_admin": True
    }
    await client.post("/auth/register-admin", json=admin_data)
    login = await client.post("/auth/login", data={
        "username": admin_data["email"],
        "password": admin_data["password"]
    })
    token = login.json()["access_token"]

    # Patch balance
    resp = await client.patch(
        f"/user/{user['id']}/balances",
        json={"real_balance": 123.45, "sim_balance": 999.99},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200
    updated = resp.json()
    assert updated["real_balance"] == 123.45
    assert updated["sim_balance"] == 999.99


@pytest.mark.asyncio
async def test_admin_patch_balances_missing(client: AsyncClient):
    """
    Patch with no fields should return 400.
    """
    # Setup admin and user
    reg = await client.post("/auth/register", json={
        "username": "no_balance",
        "email": f"no_balance_{uuid.uuid4().hex[:8]}@example.com",
        "password": "pw"
    })
    user = reg.json()

    admin_data = {
        "username": f"admin_empty_{uuid.uuid4().hex[:8]}",
        "email": f"admin_empty_{uuid.uuid4().hex[:8]}@example.com",
        "password": "pw",
        "is_admin": True
    }
    await client.post("/auth/register-admin", json=admin_data)
    login = await client.post("/auth/login", data={
        "username": admin_data["email"],
        "password": admin_data["password"]
    })
    token = login.json()["access_token"]

    # No balance fields
    resp = await client.patch(
        f"/user/{user['id']}/balances",
        json={},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "No balance fields provided"
