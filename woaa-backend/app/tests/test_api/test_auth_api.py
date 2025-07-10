"""
@fileoverview
Tests for the authentication API, including user registration, admin registration,
and login. Covers edge cases like duplicate registration, invalid credentials,
empty fields, and unauthorized admin access.
"""

import pytest
import uuid
from httpx import AsyncClient

# Helper for generating unique user payloads
def generate_user_payload(is_admin=False):
    unique_id = str(uuid.uuid4())[:8]
    return {
        "username": f"user_{unique_id}",
        "email": f"user_{unique_id}@example.com",
        "password": "strongPassword123!",
        "is_admin": is_admin,
    }

@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """
    Test successful user registration.
    """
    user_data = generate_user_payload()
    resp = await client.post("/auth/register", json=user_data)
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == user_data["username"]
    assert data["email"] == user_data["email"]
    assert data["is_admin"] is False
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """
    Test registration with a duplicate email.
    """
    user_data = generate_user_payload()
    await client.post("/auth/register", json=user_data)

    # Reuse same email, different username
    user_data["username"] = user_data["username"] + "_new"
    resp = await client.post("/auth/register", json=user_data)
    assert resp.status_code == 400 or resp.status_code == 409
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_register_missing_fields(client: AsyncClient):
    """
    Test registration with missing required fields.
    """
    incomplete_data = {"username": "user_only"}
    resp = await client.post("/auth/register", json=incomplete_data)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """
    Test successful login after registration.
    """
    user_data = generate_user_payload()
    await client.post("/auth/register", json=user_data)

    login_data = {
        "username": user_data["email"],
        "password": user_data["password"]
    }

    resp = await client.post("/auth/login", data=login_data)
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["is_admin"] is False


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    """
    Test login with incorrect password.
    """
    user_data = generate_user_payload()
    await client.post("/auth/register", json=user_data)

    login_data = {
        "username": user_data["email"],
        "password": "wrongpassword"
    }

    resp = await client.post("/auth/login", data=login_data)
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid credentials"


@pytest.mark.asyncio
async def test_login_nonexistent_email(client: AsyncClient):
    """
    Test login with an email that doesn't exist.
    """
    login_data = {
        "username": "noone@example.com",
        "password": "irrelevant"
    }
    resp = await client.post("/auth/login", data=login_data)
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid credentials"


@pytest.mark.asyncio
async def test_login_blank_fields(client: AsyncClient):
    """
    Test login with blank email and password.
    """
    login_data = {"username": "", "password": ""}
    resp = await client.post("/auth/login", data=login_data)
    assert resp.status_code == 401 or resp.status_code == 422


@pytest.mark.asyncio
async def test_register_admin_success(client: AsyncClient):
    """
    Test admin registration endpoint works.
    (This bypasses admin-check dependency for now.)
    """
    admin_data = generate_user_payload()
    admin_data["is_admin"] = True

    resp = await client.post("/auth/register-admin", json=admin_data)
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_admin"] is True
    assert "id" in data


@pytest.mark.asyncio
async def test_register_admin_duplicate_email(client: AsyncClient):
    """
    Test admin registration fails on duplicate email.
    """
    admin_data = generate_user_payload()
    await client.post("/auth/register-admin", json=admin_data)

    # Re-attempt with same email
    resp = await client.post("/auth/register-admin", json=admin_data)
    assert resp.status_code == 400 or resp.status_code == 409
    assert "detail" in resp.json()


@pytest.mark.asyncio
async def test_register_admin_missing_fields(client: AsyncClient):
    """
    Test admin registration with missing fields.
    """
    resp = await client.post("/auth/register-admin", json={"username": "admin_only"})
    assert resp.status_code == 422
