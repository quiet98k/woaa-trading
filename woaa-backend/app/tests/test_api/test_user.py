import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_me_unauthorized():
    """
    Ensure the /user/me endpoint returns 401 if not authenticated.
    """
    response = client.get("/user/me")
    assert response.status_code == 401
